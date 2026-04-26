/**
 * Agentic Renderer (AG-4)
 *
 * Wraps the standard renderVariant() with a Vision Critic feedback loop:
 *   1. Render variant
 *   2. Critique with Vision LLM
 *   3. If score < threshold AND iteration budget remaining:
 *      adjust prompt with critic suggestions → re-render
 *   4. Return the best result with metadata
 *
 * Cap: max 2 iterations per variant (cost control).
 */

import 'server-only';
import { renderVariant, type RenderInput, type RenderOutput } from '@/features/creative-studio/server/render-router';
import { critiqueImage, type VisionCritique } from './vision-critic';
import type { Variant } from '@/features/creative-studio/types';
import type { BrainOutput, VariantBrief } from '../types';
import type { createSupabaseServiceClient } from '@/lib/supabase/service';

const ITERATION_THRESHOLD = 70;
const MAX_ITERATIONS = 2;
const BUCKET = 'image-outputs';
const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

export interface AgenticRenderInput {
  variant: Variant;
  variantBrief: VariantBrief;
  brainOutput: BrainOutput;
  orgId: string;
  draftId: string;
  brandTone?: string | null;
  brandPalette?: string[];
}

export interface AgenticRenderResult {
  imageUrl: string | null;
  composedV2: boolean;
  critique: VisionCritique | null;
  iterationsRun: number;
  error?: string;
}

// ────────────────────────────────────────────────────────────────
// Public entry
// ────────────────────────────────────────────────────────────────

export async function renderVariantAgentic(
  input: AgenticRenderInput,
  svc: ReturnType<typeof createSupabaseServiceClient>,
): Promise<AgenticRenderResult> {
  let bestResult: AgenticRenderResult = {
    imageUrl: null,
    composedV2: false,
    critique: null,
    iterationsRun: 0,
  };

  let currentVariant: Variant = input.variant;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    bestResult.iterationsRun = iteration + 1;

    // 1. Render
    let renderOutput: RenderOutput;
    try {
      renderOutput = await renderVariant({
        variant: currentVariant,
        orgId: input.orgId,
        brief: undefined,
        direction: undefined,
      });
    } catch (err) {
      console.warn('[agentic-renderer] render failed', {
        variantId: currentVariant.id,
        iteration,
        error: (err as Error).message,
      });
      bestResult.error = (err as Error).message ?? 'Render failed';
      // If we have a previous good result, keep it
      if (bestResult.imageUrl) return bestResult;
      // Otherwise return the failure
      return bestResult;
    }

    // 2. Persist image (download external URL if needed → upload to our bucket)
    const path = `${input.orgId}/campaigns/${input.draftId}/${currentVariant.id}-iter${iteration}.png`;
    let buffer: Buffer | null = null;

    if (renderOutput.composedBuffer) {
      buffer = renderOutput.composedBuffer;
    } else if (renderOutput.imageUrl) {
      buffer = await downloadImage(renderOutput.imageUrl);
    }

    if (!buffer) {
      bestResult.error = 'No image buffer obtained';
      if (bestResult.imageUrl) return bestResult;
      return bestResult;
    }

    const uploadedUrl = await uploadAndSign(svc, path, buffer);
    if (!uploadedUrl) {
      bestResult.error = 'Upload/signing failed';
      if (bestResult.imageUrl) return bestResult;
      return bestResult;
    }

    // 3. Critique
    let critique: VisionCritique;
    try {
      critique = await critiqueImage({
        imageUrl: uploadedUrl,
        variantBrief: input.variantBrief,
        brainOutput: input.brainOutput,
        brandTone: input.brandTone,
        brandPalette: input.brandPalette,
      });
    } catch (err) {
      console.warn('[agentic-renderer] critic failed', {
        variantId: currentVariant.id,
        error: (err as Error).message,
      });
      // Without critique, accept this render as final
      return {
        imageUrl: uploadedUrl,
        composedV2: !!renderOutput.composedV2,
        critique: null,
        iterationsRun: iteration + 1,
      };
    }

    console.log('[agentic-renderer] iteration result', {
      variantId: currentVariant.id,
      iteration,
      score: critique.score,
      verdict: critique.verdict,
    });

    // Track the best so far (highest score)
    const isBetter =
      !bestResult.critique || critique.score > bestResult.critique.score;
    if (isBetter) {
      bestResult = {
        imageUrl: uploadedUrl,
        composedV2: !!renderOutput.composedV2,
        critique,
        iterationsRun: iteration + 1,
      };
    }

    // 4. Decide if we iterate
    if (critique.score >= ITERATION_THRESHOLD) {
      // Pass — return best result
      return bestResult;
    }

    if (iteration < MAX_ITERATIONS - 1 && critique.suggestions.length > 0) {
      // Adjust prompt with suggestions and try again
      const adjustedPrompt = augmentPromptWithFeedback(
        currentVariant.renderPrompt ?? '',
        critique,
      );
      currentVariant = {
        ...currentVariant,
        renderPrompt: adjustedPrompt,
      };
      console.log('[agentic-renderer] iterating with feedback', {
        variantId: currentVariant.id,
        nextIteration: iteration + 1,
        newPromptLength: adjustedPrompt.length,
      });
      continue;
    }

    // Out of iterations or no suggestions — return best
    return bestResult;
  }

  return bestResult;
}

// ────────────────────────────────────────────────────────────────
// Prompt adjustment
// ────────────────────────────────────────────────────────────────

function augmentPromptWithFeedback(
  originalPrompt: string,
  critique: VisionCritique,
): string {
  const adjustments = critique.suggestions
    .slice(0, 3)
    .map((s) => `- ${s}`)
    .join('\n');

  return [
    originalPrompt,
    '',
    'CRITICAL ADJUSTMENTS based on prior render:',
    adjustments,
    '',
    'Apply these adjustments while keeping all other guidance.',
  ].join('\n');
}

// ────────────────────────────────────────────────────────────────
// Storage helpers
// ────────────────────────────────────────────────────────────────

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

async function uploadAndSign(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  path: string,
  buffer: Buffer,
): Promise<string | null> {
  const { error: upErr } = await svc.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'image/png',
      cacheControl: '604800',
      upsert: true,
    });
  if (upErr) return null;

  const { data: signed } = await svc.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  return signed?.signedUrl ?? null;
}
