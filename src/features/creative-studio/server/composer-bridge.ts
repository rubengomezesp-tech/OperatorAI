/**
 * Operator AI — Composer V2 Bridge (DEFINITIVE)
 *
 * Converts Variant → CreativePlan with 100% type compliance:
 *   - AspectRatio: '9:16' | '1:1' | '4:5' (your exact values)
 *   - CreativePlan.headline is REQUIRED (so we always provide one)
 *   - CreativePlan.cta is optional
 *   - All composer types verified
 */

import 'server-only';
import type { Variant, VariantLayout, AspectRatio } from '../types';
import type {
  CreativePlan,
  Platform,
  SafeZonePosition,
  LogoPosition,
  ColorRole,
  TextAlign,
  CtaStyle,
  PlanCta,
  PlanHeadline,
  PlanLogo,
} from '@/lib/composer';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

/**
 * Convert a Variant to a CreativePlan (without background).
 *
 * Headline is always required by CreativePlan, so if variant
 * doesn't have one, we use the variant intent as fallback.
 * If neither exists, returns null (caller should skip V2).
 */
export function variantToCreativePlan(
  variant: Variant
): Omit<CreativePlan, 'background'> | null {
  const headlineText = (variant.copy?.headline?.trim() || variant.intent?.trim() || '').slice(0, 80);

  // CreativePlan requires headline — if we have nothing usable, skip V2
  if (!headlineText) {
    return null;
  }

  const platform = aspectRatioToPlatform(variant.aspectRatio);
  const ctaText = variant.copy?.cta?.trim() || null;

  // Build required fields
  const planHeadline: PlanHeadline = {
    text: headlineText,
    fontRole: pickHeadlineFontRole(variant.layout),
    sizePct: pickHeadlineSize(variant.layout),
    colorRole: pickHeadlineColor(variant),
    position: pickHeadlinePosition(variant.layout),
    align: pickHeadlineAlign(variant.layout),
  };

  const plan: Omit<CreativePlan, 'background'> = {
    platform,
    headline: planHeadline,
  };

  // Optional CTA
  if (ctaText) {
    const planCta: PlanCta = {
      text: ctaText,
      style: pickCtaStyle(variant.layout),
      bgColorRole: 'primary',
      textColorRole: 'onLight',
    };
    plan.cta = planCta;
  }

  // Optional logo
  if (variant.composition?.logoIndex !== undefined) {
    const planLogo: PlanLogo = {
      position: mapLogoPosition(variant.composition.logoPosition),
      paddingPct: 5,
      maxWidthPct: 18,
    };
    plan.logo = planLogo;
  }

  return plan;
}

/**
 * Should we even try V2 for this variant?
 * Returns false if there's no headline or fallback intent.
 */
export function variantHasComposableContent(variant: Variant): boolean {
  const text =
    variant.copy?.headline?.trim() || variant.intent?.trim() || '';
  return text.length > 0;
}

// ────────────────────────────────────────────────────────────────
// MAPPING HELPERS
// ────────────────────────────────────────────────────────────────

/**
 * Map your AspectRatio (9:16 | 1:1 | 4:5) → composer Platform.
 * Composer derives width/height/safe-zone from platform name.
 */
function aspectRatioToPlatform(ratio: AspectRatio): Platform {
  switch (ratio) {
    case '1:1':
      return 'instagram_feed';
    case '4:5':
      return 'meta_ad_square';
    case '9:16':
      return 'instagram_story';
    default: {
      // Exhaustive check — TypeScript ensures all AspectRatio cases handled
      const _exhaustive: never = ratio;
      void _exhaustive;
      return 'instagram_feed';
    }
  }
}

function pickHeadlineFontRole(layout: VariantLayout): 'primary' | 'display' {
  const layoutStr = String(layout).toLowerCase();
  if (
    layoutStr.includes('editorial') ||
    layoutStr.includes('magazine') ||
    layoutStr.includes('brutalist') ||
    layoutStr.includes('hero') ||
    layoutStr.includes('bold') ||
    layoutStr.includes('display')
  ) {
    return 'display';
  }
  return 'primary';
}

function pickHeadlineSize(layout: VariantLayout): number {
  const layoutStr = String(layout).toLowerCase();
  if (
    layoutStr.includes('hero') ||
    layoutStr.includes('brutalist') ||
    layoutStr.includes('magazine') ||
    layoutStr.includes('bold')
  ) {
    return 9;
  }
  if (
    layoutStr.includes('editorial') ||
    layoutStr.includes('minimal')
  ) {
    return 7;
  }
  return 6;
}

function pickHeadlineColor(variant: Variant): ColorRole {
  const mood = variant.mood?.toLowerCase() ?? '';
  if (
    mood.includes('dark') ||
    mood.includes('night') ||
    mood.includes('moody') ||
    mood.includes('luxury') ||
    mood.includes('bold')
  ) {
    return 'onDark';
  }
  if (
    mood.includes('light') ||
    mood.includes('bright') ||
    mood.includes('clean') ||
    mood.includes('white') ||
    mood.includes('minimal')
  ) {
    return 'onLight';
  }
  return 'onDark';
}

function pickHeadlinePosition(layout: VariantLayout): SafeZonePosition {
  const layoutStr = String(layout).toLowerCase();
  if (layoutStr.includes('top') || layoutStr.includes('editorial')) {
    return 'top';
  }
  if (layoutStr.includes('bottom') || layoutStr.includes('classic')) {
    return 'bottom';
  }
  if (layoutStr.includes('center') || layoutStr.includes('hero')) {
    return 'center';
  }
  return 'top';
}

function pickHeadlineAlign(layout: VariantLayout): TextAlign {
  const layoutStr = String(layout).toLowerCase();
  if (
    layoutStr.includes('center') ||
    layoutStr.includes('hero') ||
    layoutStr.includes('minimal')
  ) {
    return 'center';
  }
  return 'left';
}

function pickCtaStyle(layout: VariantLayout): CtaStyle {
  const layoutStr = String(layout).toLowerCase();
  if (layoutStr.includes('brutalist') || layoutStr.includes('magazine')) {
    return 'rect';
  }
  if (layoutStr.includes('minimal') || layoutStr.includes('editorial')) {
    return 'pill';
  }
  if (layoutStr.includes('elegant') || layoutStr.includes('luxury')) {
    return 'underline';
  }
  return 'pill';
}

function mapLogoPosition(pos: unknown): LogoPosition {
  const str = String(pos ?? '').toLowerCase();
  if (str.includes('top-left')) return 'top-left';
  if (str.includes('top-right')) return 'top-right';
  if (str.includes('top-center') || str.includes('top')) return 'top-center';
  if (str.includes('bottom-left')) return 'bottom-left';
  if (str.includes('bottom-right')) return 'bottom-right';
  if (str.includes('bottom-center') || str.includes('bottom')) return 'bottom-center';
  if (str.includes('center')) return 'center';
  return 'bottom-right';
}
