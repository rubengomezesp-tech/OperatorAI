/**
 * Operator AI — Premium Composer
 * Phase 1.4 / Pipeline Orchestrator
 *
 * The single entry point that routes between:
 *   - V1 (legacy): existing flux-renderer with everything baked in
 *   - V2 (premium): clean background + Sharp composite
 *
 * Architecture:
 *   Caller calls runCreativePipeline(input)
 *   ↓
 *   Flag check: V1 or V2?
 *   ↓
 *   V1 → forward to legacy renderer (no changes to existing code)
 *   V2 → strip text from prompt → render bg → composer → upload → return
 *
 * IMPORTANT: V2 path does NOT yet replace your /api/creative route.
 * It's a separate utility that you can opt-in to call. Phase 1.5
 * adds the integration into your existing route.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreativePlan } from './types';
import { composeAd } from './composer';
import { getBrandKitForOrg } from './brand-adapter';
import { isComposerV2Enabled, type ComposerFlagContext, explainFlagDecision } from './flag';
import { stripTextFromPrompt, buildNoTextNegativePrompt } from './prompt-cleanup';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface CreativePipelineInput {
  /** Flag context for V1/V2 routing */
  flag: ComposerFlagContext;
  /** Org ID — used to fetch brand kit */
  orgId: string;
  /** Original user prompt */
  prompt: string;
  /** Pre-built creative plan (text, CTA, logo) */
  plan: Omit<CreativePlan, 'background'>;
  /** Supabase client for brand fetching */
  supabase: SupabaseClient;
  /** Background renderer function (your existing Flux/Imagen wrapper) */
  renderBackground: (params: BackgroundRenderParams) => Promise<{ imageUrl: string }>;
}

export interface BackgroundRenderParams {
  prompt: string;
  negativePrompt?: string;
  aspect: '1:1' | '4:5' | '9:16' | '16:9' | '1.91:1';
  width: number;
  height: number;
}

export interface CreativePipelineOutput {
  /** Pipeline version that ran */
  pipelineVersion: 'v1' | 'v2';
  /** Final image URL (if uploaded) or buffer */
  imageBuffer?: Buffer;
  imageUrl?: string;
  /** Diagnostic info */
  meta: {
    flagDecision: string;
    durationMs: number;
    backgroundUrl?: string;
  };
}

/**
 * Main pipeline entry point.
 *
 * Behaviour:
 * - If V2 disabled: throws (caller must use legacy path themselves).
 *   This is intentional — we don't want to silently re-route legacy calls.
 * - If V2 enabled: full premium pipeline (bg render → composer → buffer).
 */
export async function runComposerPipeline(
  input: CreativePipelineInput
): Promise<CreativePipelineOutput> {
  const start = Date.now();
  const enabled = isComposerV2Enabled(input.flag);
  const decision = explainFlagDecision(input.flag);

  if (!enabled) {
    throw new ComposerDisabledError(
      `Composer V2 is disabled (${decision}). Use legacy renderer instead.`
    );
  }

  // 1. Resolve brand kit
  const brandKit = await getBrandKitForOrg(input.supabase, input.orgId);

  // 2. Strip text instructions from prompt (AI generates clean bg only)
  const cleanedPrompt = stripTextFromPrompt(input.prompt);
  const negativePrompt = buildNoTextNegativePrompt();

  // 3. Render background using caller's renderer
  const targetPreset = pickPresetForPlatform(input.plan.platform);
  const bgResult = await input.renderBackground({
    prompt: cleanedPrompt,
    negativePrompt,
    aspect: targetPreset.aspect as BackgroundRenderParams['aspect'],
    width: targetPreset.width,
    height: targetPreset.height,
  });

  // 4. Compose final ad
  const fullPlan: CreativePlan = {
    ...input.plan,
    background: { imageUrl: bgResult.imageUrl },
  };

  const result = await composeAd({
    brandKit,
    plan: fullPlan,
    preset: targetPreset,
  });

  return {
    pipelineVersion: 'v2',
    imageBuffer: result.buffer,
    meta: {
      flagDecision: decision,
      durationMs: Date.now() - start,
      backgroundUrl: bgResult.imageUrl,
    },
  };
}

/**
 * Custom error so callers can `catch` it specifically and fall back
 * to legacy path without confusing it with real errors.
 */
export class ComposerDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComposerDisabledError';
  }
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

import { getDefaultPresetForPlatform } from './presets';
import type { Platform, FormatPreset } from './types';

function pickPresetForPlatform(platform: Platform): FormatPreset {
  return getDefaultPresetForPlatform(platform);
}

// ────────────────────────────────────────────────────────────────
// INTEGRATION HELPERS — for your existing routes
// ────────────────────────────────────────────────────────────────

/**
 * Try V2; if disabled or fails, return null so caller can use V1.
 * This is the recommended pattern for non-breaking integration.
 *
 * Example usage in /api/creative/route.ts:
 *
 *   const v2 = await tryComposerV2({ ... });
 *   if (v2) return new Response(v2.imageBuffer, { headers: ... });
 *   return await legacyFluxRenderer(...);  // your current code
 */
export async function tryComposerV2(
  input: CreativePipelineInput
): Promise<CreativePipelineOutput | null> {
  try {
    return await runComposerPipeline(input);
  } catch (err) {
    if (err instanceof ComposerDisabledError) {
      return null; // expected — caller will use V1
    }
    // Real error — log and fall back to V1 anyway
    // eslint-disable-next-line no-console
    console.error('[composer] V2 failed, falling back to V1:', (err as Error).message);
    return null;
  }
}
