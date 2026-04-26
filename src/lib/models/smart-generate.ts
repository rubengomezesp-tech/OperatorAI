/**
 * Operator AI — Composer ⨯ Router Bridge
 * Phase 2.5 / Smart Pipeline
 *
 * Path: src/lib/models/smart-generate.ts
 *
 * Full premium pipeline:
 *   Brief → Detect output type → Router selects model →
 *   Render background → Composer adds text/CTA/logo → Return buffer
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreativePlan, BrandKit } from '@/lib/composer';
import { composeAd, getDefaultPresetForPlatform } from '@/lib/composer';
import { getBrandKitForOrg } from '@/lib/composer';
import { stripTextFromPrompt, buildNoTextNegativePrompt } from '@/lib/composer';
import type { OutputType, Tier, RenderResult, AspectInput } from './types';
import { renderWithFallback, explainRouting } from './router';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface SmartGenerateInput {
  orgId: string;
  tier: Tier;
  prompt: string;
  plan: Omit<CreativePlan, 'background'>;
  supabase: SupabaseClient;
  outputType?: OutputType;
  referenceImages?: string[];
  upscale?: boolean;
  brandKitOverride?: BrandKit;
}

export interface SmartGenerateOutput {
  imageBuffer: Buffer;
  contentType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  brandKit: BrandKit;
  plan: CreativePlan;
  meta: {
    routerDecision: string;
    backgroundModel: string;
    backgroundUrl: string;
    backgroundCostCents: number;
    backgroundDurationMs: number;
    composerDurationMs: number;
    upscaledFrom?: { width: number; height: number };
    totalCostCents: number;
    totalDurationMs: number;
  };
}

/**
 * The all-in-one premium ad generator.
 */
export async function smartGenerate(input: SmartGenerateInput): Promise<SmartGenerateOutput> {
  const start = Date.now();

  // 1. Resolve brand kit
  const brandKit =
    input.brandKitOverride ?? (await getBrandKitForOrg(input.supabase, input.orgId));

  // 2. Detect output type
  const outputType: OutputType = input.outputType ?? detectOutputType(input);

  // 3. Build router context
  const ctx = {
    outputType,
    tier: input.tier,
  };

  const routerDecision = explainRouting(ctx);

  // 4. Pick preset & dimensions
  const preset = getDefaultPresetForPlatform(input.plan.platform);
  const aspect = preset.aspect as AspectInput;

  // 5. Clean prompt
  const cleanedPrompt = stripTextFromPrompt(input.prompt);
  const negativePrompt = buildNoTextNegativePrompt();

  // 6. Render background via router
  const bgResult: RenderResult = await renderWithFallback(ctx, {
    prompt: cleanedPrompt,
    negativePrompt,
    aspect,
    width: preset.width,
    height: preset.height,
    referenceImages: input.referenceImages,
    logoUrl: brandKit.logoUrl ?? undefined,
  });

  // 7. Compose final ad
  const composeStart = Date.now();
  const fullPlan: CreativePlan = {
    ...input.plan,
    background: { imageUrl: bgResult.imageUrl },
  };

  const composed = await composeAd({
    brandKit,
    plan: fullPlan,
    preset,
  });
  const composerDurationMs = Date.now() - composeStart;

  // 8. Optional upscale (skipped for now — needs upload first)
  let finalBuffer = composed.buffer;
  let finalWidth = composed.width;
  let finalHeight = composed.height;
  let upscaledFrom: { width: number; height: number } | undefined;
  let upscaleCost = 0;

  if (input.upscale && input.tier !== 'free') {
    // eslint-disable-next-line no-console
    console.info('[smart-generate] Upscale requested but skipped (requires upload first)');
  }

  const totalDurationMs = Date.now() - start;
  const totalCostCents = bgResult.costCents + upscaleCost;

  return {
    imageBuffer: finalBuffer,
    contentType: composed.contentType,
    width: finalWidth,
    height: finalHeight,
    brandKit,
    plan: fullPlan,
    meta: {
      routerDecision,
      backgroundModel: bgResult.modelId,
      backgroundUrl: bgResult.imageUrl,
      backgroundCostCents: bgResult.costCents,
      backgroundDurationMs: bgResult.durationMs,
      composerDurationMs,
      upscaledFrom,
      totalCostCents,
      totalDurationMs,
    },
  };
}

// ────────────────────────────────────────────────────────────────
// OUTPUT TYPE DETECTION
// ────────────────────────────────────────────────────────────────

function detectOutputType(input: SmartGenerateInput): OutputType {
  const plan = input.plan;
  const prompt = input.prompt.toLowerCase();
  const refs = input.referenceImages ?? [];

  // Multi-reference with logo → logo-locked composition
  if (refs.length >= 2) {
    return 'logo-locked';
  }

  // Mockup keywords
  if (
    /\b(mockup|tshirt|t-shirt|hoodie|cap|tote|product|garment|apparel)\b/i.test(prompt)
  ) {
    return 'mockup';
  }

  // Poster / typography keywords
  if (
    /\b(poster|typography|brutalist|editorial|magazine cover|swiss design)\b/i.test(prompt)
  ) {
    return 'poster';
  }

  // Default: ad with overlaid text
  if (plan.headline || plan.cta) {
    return 'ad-with-text';
  }

  return 'background-only';
}
