/**
 * Brain → Variant Bridge (Premium)
 *
 * Now async — loads Brand kit and constructs premium prompt
 * before producing legacy Variant[] for the render-router.
 */

import 'server-only';
import type {
  BrainOutput,
  VariantBrief,
  AspectRatio as BrainAspectRatio,
  AngleSlug,
  VerticalSlug,
} from '../types';
import type {
  Variant,
  VariantAngle,
  VariantLayout,
  RenderEngine,
  AspectRatio as LegacyAspectRatio,
  Intensity,
  VisualStyle,
} from '@/features/creative-studio/types';
import {
  buildPremiumImagePrompt,
  loadBrandKitForPrompt,
  type BrandKitForPrompt,
} from './premium-prompt-builder';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// ────────────────────────────────────────────────────────────────
// MAPPERS (unchanged from previous bridge)
// ────────────────────────────────────────────────────────────────

function mapAngle(slug: AngleSlug): VariantAngle {
  const map: Record<AngleSlug, VariantAngle> = {
    'pain-point': 'pain',
    desire: 'result',
    authority: 'authority',
    luxury: 'authority',
    viral: 'aggressive',
    conversion: 'result',
    curiosity: 'curiosity',
    urgency: 'aggressive',
    'social-proof': 'authority',
  };
  return map[slug] ?? 'result';
}

function mapAspectRatio(ar: BrainAspectRatio): LegacyAspectRatio {
  return ar;
}

function pickLayout(angle: AngleSlug): VariantLayout {
  switch (angle) {
    case 'authority':
    case 'luxury':
      return 'minimal_branding';
    case 'pain-point':
    case 'desire':
      return 'hero_app';
    case 'social-proof':
    case 'curiosity':
      return 'feature_grid';
    case 'urgency':
    case 'viral':
      return 'story_ad';
    case 'conversion':
    default:
      return 'ui_focus';
  }
}

function pickIntensity(angle: AngleSlug): Intensity {
  switch (angle) {
    case 'urgency':
    case 'viral':
    case 'pain-point':
      return 'aggressive';
    case 'authority':
    case 'luxury':
    case 'desire':
      return 'soft';
    default:
      return 'medium';
  }
}

function pickVisualStyle(angle: AngleSlug, aesthetic?: string): VisualStyle {
  if (aesthetic === 'editorial') return 'editorial_magazine';
  if (aesthetic === 'luxury') return 'luxury_beige';
  if (aesthetic === 'tech-modern') return 'tech_product_white';
  if (aesthetic === 'minimal') return 'minimal_swiss';

  switch (angle) {
    case 'luxury':
      return 'luxury_beige';
    case 'authority':
      return 'editorial_magazine';
    case 'viral':
    case 'urgency':
      return 'social_media_ad';
    case 'desire':
      return 'lifestyle_product';
    case 'pain-point':
      return 'dark_cinematic';
    default:
      return 'clean_bright';
  }
}

// ────────────────────────────────────────────────────────────────
// PREMIUM BRIDGE
// ────────────────────────────────────────────────────────────────

export interface BridgeContext {
  /** Org id — for loading Brand kit */
  orgId: string;
  /** Optional uploaded product photos */
  productPhotoUrls?: string[];
  /** Optional Gemini Vision analyses of the uploaded photos */
  productAnalyses?: Array<{
    productType: string;
    generationDescription: string;
    colors: string[];
    materials: string[];
  }>;
}

/**
 * Convert ONE variant brief → premium Variant.
 *
 * Builds a layered prompt that includes:
 *   - Brand kit (Brand OS)
 *   - Brain diagnostic (audience, hidden desire)
 *   - Visual direction
 *   - Hook → visual translation
 *   - Vertical knowledge
 *   - Platform safe-zones
 *   - Negative prompt
 */
async function variantBriefToVariantAsync(
  brief: VariantBrief,
  brainOutput: BrainOutput,
  vertical: VerticalSlug,
  brandKit: BrandKitForPrompt | null,
  productPhotoUrls: string[] | undefined,
  productAnalyses: Array<{
    productType: string;
    generationDescription: string;
    colors: string[];
    materials: string[];
  }> | undefined,
): Promise<Variant> {
  const premium = buildPremiumImagePrompt({
    variantBrief: brief,
    brainOutput,
    vertical,
    brandKit,
    productPhotoUrls,
    productAnalyses,
    researchDossier: brainOutput.researchDossier
      ? {
          visualReferences: brainOutput.researchDossier.visualReferences,
          productFacts: brainOutput.researchDossier.productFacts,
        }
      : null,
  });

  console.log('[brain-to-variant] premium prompt built', {
    variantId: brief.id,
    layers: premium.layers,
    promptLength: premium.prompt.length,
  });

  return {
    id: brief.id,
    layout: pickLayout(brief.angle),
    angle: mapAngle(brief.angle),
    intent: brief.headline,
    // referenceImages — picked up by engine-selector to switch to nano-banana
    referenceImages: productPhotoUrls ?? [],
    engine: 'gpt-image' as RenderEngine, // Premium default (overridden by selector when refs present)
    copy: {
      headline: brief.headline,
      subheadline: '',
      cta: brief.cta,
    } as never,
    composition: {
      heroPosition: 'center',
      textPosition: 'bottom',
      logoPosition: 'top-left',
    } as never,
    mood: brainOutput.visualDirection?.moodDescription ?? '',
    palette: brandKit?.palette ?? [],
    confidence: brainOutput.confidence,
    reasoningSummary: brief.reasoning,
    aspectRatio: mapAspectRatio(brief.aspectRatio),
    // ★ THIS is what the renderer must respect — the layered premium prompt
    renderPrompt: premium.prompt,
    visualDirection: brainOutput.visualDirection?.aesthetic ?? '',
    compositionHint: brainOutput.visualDirection?.composition ?? '',
    intensity: pickIntensity(brief.angle),
    styleHint: pickVisualStyle(
      brief.angle,
      brainOutput.visualDirection?.aesthetic,
    ),
  };
}

/**
 * Convert ALL variant briefs → Variant[] with premium prompts.
 *
 * IMPORTANT: this is async now — caller must await.
 */
export async function brainOutputToVariantsAsync(
  brainOutput: BrainOutput,
  context: BridgeContext,
): Promise<Variant[]> {
  // Load brand kit ONCE (shared across all variants)
  const svc = createSupabaseServiceClient();
  const brandKit = await loadBrandKitForPrompt(svc, context.orgId);

  // Determine vertical from brain output
  const vertical: VerticalSlug =
    (brainOutput.detectedVertical as VerticalSlug) ?? 'other';

  return Promise.all(
    brainOutput.variantBriefs.map((brief) =>
      variantBriefToVariantAsync(
        brief,
        brainOutput,
        vertical,
        brandKit,
        context.productPhotoUrls,
        context.productAnalyses,
      ),
    ),
  );
}

/**
 * Sync version (legacy) — still exported for backwards compat.
 * Does NOT load brand kit, but otherwise produces a working Variant.
 */
export function brainOutputToVariants(brainOutput: BrainOutput): Variant[] {
  const vertical: VerticalSlug =
    (brainOutput.detectedVertical as VerticalSlug) ?? 'other';

  return brainOutput.variantBriefs.map((brief) => {
    const premium = buildPremiumImagePrompt({
      variantBrief: brief,
      brainOutput,
      vertical,
      brandKit: null,
      productPhotoUrls: undefined,
      researchDossier: brainOutput.researchDossier
        ? {
            visualReferences: brainOutput.researchDossier.visualReferences,
            productFacts: brainOutput.researchDossier.productFacts,
          }
        : null,
    });

    return {
      id: brief.id,
      layout: pickLayout(brief.angle),
      angle: mapAngle(brief.angle),
      intent: brief.headline,
      engine: 'gpt-image' as RenderEngine,
      copy: {
        headline: brief.headline,
        subheadline: '',
        cta: brief.cta,
      } as never,
      composition: {
        heroPosition: 'center',
        textPosition: 'bottom',
        logoPosition: 'top-left',
      } as never,
      mood: brainOutput.visualDirection?.moodDescription ?? '',
      palette: [],
      confidence: brainOutput.confidence,
      reasoningSummary: brief.reasoning,
      aspectRatio: mapAspectRatio(brief.aspectRatio),
      renderPrompt: premium.prompt,
      visualDirection: brainOutput.visualDirection?.aesthetic ?? '',
      compositionHint: brainOutput.visualDirection?.composition ?? '',
      intensity: pickIntensity(brief.angle),
      styleHint: pickVisualStyle(
        brief.angle,
        brainOutput.visualDirection?.aesthetic,
      ),
    };
  });
}
