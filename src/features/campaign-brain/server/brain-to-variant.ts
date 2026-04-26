/**
 * Brain → Variant Bridge
 *
 * Converts BrainOutput.variantBriefs (Campaign Brain V2 format)
 * into Variant[] (creative-studio legacy format) so that the existing
 * render-router pipeline can render them with Composer V2.
 *
 * This is the connection between the Brain (strategy) and the
 * existing render pipeline (Flux/GPT-image + Composer V2).
 */

import 'server-only';
import type {
  BrainOutput,
  VariantBrief,
  AspectRatio as BrainAspectRatio,
  AngleSlug,
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

// ────────────────────────────────────────────────────────────────
// MAPPERS
// ────────────────────────────────────────────────────────────────

/**
 * Map Campaign Brain angles to legacy VariantAngle.
 *
 * Legacy supports: 'pain' | 'result' | 'authority' | 'curiosity' | 'aggressive'
 * Brain has 9 angles — we map them to the closest legacy match.
 */
function mapAngle(slug: AngleSlug): VariantAngle {
  const map: Record<AngleSlug, VariantAngle> = {
    'pain-point': 'pain',
    'desire': 'result',
    'authority': 'authority',
    'luxury': 'authority',
    'viral': 'aggressive',
    'conversion': 'result',
    'curiosity': 'curiosity',
    'urgency': 'aggressive',
    'social-proof': 'authority',
  };
  return map[slug] ?? 'result';
}

/**
 * Aspect ratios are compatible — both use '9:16' | '1:1' | '4:5'
 */
function mapAspectRatio(ar: BrainAspectRatio): LegacyAspectRatio {
  return ar;
}

/**
 * Map angle to layout (best-fit for visual structure).
 */
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

/**
 * Map angle to intensity.
 */
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

/**
 * Pick a default visual style based on angle + aesthetic.
 */
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
// MAIN BRIDGE FUNCTION
// ────────────────────────────────────────────────────────────────

/**
 * Convert ONE variant brief from Brain → legacy Variant.
 */
export function variantBriefToVariant(
  brief: VariantBrief,
  brainOutput: BrainOutput,
): Variant {
  return {
    id: brief.id,
    layout: pickLayout(brief.angle),
    angle: mapAngle(brief.angle),
    intent: brief.headline,
    engine: 'flux' as RenderEngine, // Default to Flux; engine-selector may switch
    copy: {
      headline: brief.headline,
      subheadline: '',
      cta: brief.cta,
      // Legacy types may have more fields — these can stay empty
    } as never,
    composition: {
      // Composer V2 will derive composition from prompt + brand
      // Leaving as a minimal default
      heroPosition: 'center',
      textPosition: 'bottom',
      logoPosition: 'top-left',
    } as never,
    mood: brainOutput.visualDirection.moodDescription,
    palette: [], // Brand kit is fetched by Composer V2 via orgId
    confidence: brainOutput.confidence,
    reasoningSummary: brief.reasoning,
    aspectRatio: mapAspectRatio(brief.aspectRatio),
    renderPrompt: brief.backgroundPrompt,
    visualDirection: brainOutput.visualDirection.aesthetic,
    compositionHint: brainOutput.visualDirection.composition,
    intensity: pickIntensity(brief.angle),
    styleHint: pickVisualStyle(brief.angle, brainOutput.visualDirection.aesthetic),
  };
}

/**
 * Convert ALL variant briefs from Brain → legacy Variant[].
 */
export function brainOutputToVariants(brainOutput: BrainOutput): Variant[] {
  return brainOutput.variantBriefs.map((brief) =>
    variantBriefToVariant(brief, brainOutput),
  );
}
