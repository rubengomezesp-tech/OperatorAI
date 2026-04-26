/**
 * Operator AI — Composer V2 Bridge (FINAL)
 *
 * Converts Variant → CreativePlan using actual types from @/lib/composer.
 * All types verified against src/lib/composer/types.ts:
 *   - PlanHeadline { text, fontRole, sizePct, colorRole, position, align }
 *   - PlanCta { text, style, bgColorRole, textColorRole }
 *   - PlanLogo { position, paddingPct, maxWidthPct }
 *   - CtaStyle: 'pill' | 'rect' | 'underline' | 'ghost'
 *   - LogoPosition: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'center'
 *   - SafeZonePosition: 'top' | 'center' | 'bottom'
 *   - ColorRole: 'primary' | 'secondary' | 'accent' | 'onDark' | 'onLight' | 'background'
 *   - TextAlign: 'left' | 'center' | 'right'
 *   - Platform: 'instagram_feed' | 'instagram_story' | 'instagram_reel' | 'tiktok' | 'meta_ad_square' | 'meta_ad_landscape' | 'youtube_short' | 'twitter_post'
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
 * The background URL is added later in the pipeline.
 */
export function variantToCreativePlan(
  variant: Variant
): Omit<CreativePlan, 'background'> {
  const platform = aspectRatioToPlatform(variant.aspectRatio);
  const headline = variant.copy?.headline?.trim() || null;
  const cta = variant.copy?.cta?.trim() || null;

  const plan: Omit<CreativePlan, 'background'> = {
    platform,
  };

  if (headline) {
    const planHeadline: PlanHeadline = {
      text: headline,
      fontRole: pickHeadlineFontRole(variant.layout),
      sizePct: pickHeadlineSize(variant.layout),
      colorRole: pickHeadlineColor(variant),
      position: pickHeadlinePosition(variant.layout),
      align: pickHeadlineAlign(variant.layout),
    };
    plan.headline = planHeadline;
  }

  if (cta) {
    const planCta: PlanCta = {
      text: cta,
      style: pickCtaStyle(variant.layout),
      bgColorRole: 'primary',
      textColorRole: 'onLight',
    };
    plan.cta = planCta;
  }

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
 * Heuristic: should we even try V2 for this variant?
 * Returns false if there's nothing to compose.
 */
export function variantHasComposableContent(variant: Variant): boolean {
  const hasHeadline = !!variant.copy?.headline?.trim();
  const hasCta = !!variant.copy?.cta?.trim();
  const hasLogo = variant.composition?.logoIndex !== undefined;
  return hasHeadline || hasCta || hasLogo;
}

// ────────────────────────────────────────────────────────────────
// MAPPING HELPERS — VALIDATED TYPES
// ────────────────────────────────────────────────────────────────

function aspectRatioToPlatform(ratio: AspectRatio): Platform {
  switch (ratio) {
    case '1:1':
      return 'instagram_feed';
    case '4:5':
      return 'instagram_feed';
    case '9:16':
      return 'instagram_story';
    case '16:9':
      return 'twitter_post';
    case '1.91:1':
      return 'meta_ad_landscape';
    default:
      return 'instagram_feed';
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
  // Defensive: pos may be string, undefined, or object
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
