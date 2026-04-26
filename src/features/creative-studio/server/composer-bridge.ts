/**
 * Operator AI — Composer V2 Bridge
 *
 * Converts your existing Variant type → composer's CreativePlan type.
 * This is the only adapter between your pipeline and the V2 composer.
 *
 * Why a bridge?
 *   - Your Variant has rich metadata (mood, palette, layout, angle)
 *   - Composer's CreativePlan expects layout/text/CTA/logo objects
 *   - The bridge maps semantic fields without changing either side
 *
 * Usage:
 *   import { variantToCreativePlan } from './composer-bridge';
 *   const plan = variantToCreativePlan(variant, supabaseClient, orgId);
 *   const result = await tryComposerV2({ plan, ... });
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Variant,
  VariantLayout,
  LogoPosition as VariantLogoPosition,
  AspectRatio,
} from '../types';
import type {
  CreativePlan,
  Platform,
  TextPosition,
  TextAlign,
  LogoCorner,
  CTAStyle,
  ColorRole,
  FontRole,
} from '@/lib/composer';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

/**
 * Convert a Variant to a CreativePlan (without background — the
 * composer accepts plans that don't yet have a background URL,
 * which gets added later in the pipeline).
 */
export function variantToCreativePlan(
  variant: Variant
): Omit<CreativePlan, 'background'> {
  const platform = aspectRatioToPlatform(variant.aspectRatio);
  const headline = variant.copy?.headline?.trim() || null;
  const cta = variant.copy?.cta?.trim() || null;

  return {
    platform,
    headline: headline
      ? {
          text: headline,
          fontRole: pickHeadlineFontRole(variant.layout),
          sizePct: pickHeadlineSize(variant.layout),
          colorRole: pickHeadlineColor(variant),
          position: pickHeadlinePosition(variant.layout),
          align: pickHeadlineAlign(variant.layout),
        }
      : undefined,
    cta: cta
      ? {
          text: cta,
          style: pickCtaStyle(variant.layout),
          bgColorRole: 'primary',
          textColorRole: 'onLight',
        }
      : undefined,
    logo: variant.composition?.logoIndex !== undefined
      ? {
          position: mapLogoPosition(variant.composition.logoPosition),
          paddingPct: 5,
          maxWidthPct: 18,
        }
      : undefined,
  };
}

/**
 * Heuristic: should we even try V2 for this variant?
 * Returns false if there's nothing to compose (no headline + no CTA + no logo).
 */
export function variantHasComposableContent(variant: Variant): boolean {
  const hasHeadline = !!variant.copy?.headline?.trim();
  const hasCta = !!variant.copy?.cta?.trim();
  const hasLogo = variant.composition?.logoIndex !== undefined;
  return hasHeadline || hasCta || hasLogo;
}

// ────────────────────────────────────────────────────────────────
// MAPPING HELPERS
// ────────────────────────────────────────────────────────────────

function aspectRatioToPlatform(ratio: AspectRatio): Platform {
  // Map your aspect ratios to composer's platform presets.
  // The composer uses platform name to derive width/height/safe zones.
  switch (ratio) {
    case '1:1':
      return 'instagram_feed';
    case '4:5':
      return 'instagram_feed'; // 4:5 also fits feed
    case '9:16':
      return 'instagram_story';
    case '16:9':
      return 'twitter_post';
    case '1.91:1':
      return 'meta_ads';
    default:
      return 'instagram_feed';
  }
}

function pickHeadlineFontRole(layout: VariantLayout): FontRole {
  // Bold/editorial layouts → display font; default → primary
  switch (layout) {
    case 'editorial':
    case 'magazine':
    case 'brutalist':
    case 'hero':
      return 'display';
    default:
      return 'primary';
  }
}

function pickHeadlineSize(layout: VariantLayout): number {
  // Size as % of canvas width. Bold layouts use bigger text.
  switch (layout) {
    case 'hero':
    case 'brutalist':
    case 'magazine':
      return 9;
    case 'editorial':
    case 'minimal':
      return 7;
    case 'classic':
    case 'duo':
      return 6;
    default:
      return 6;
  }
}

function pickHeadlineColor(variant: Variant): ColorRole {
  // If variant has dark mood → onDark text; light mood → onLight
  const mood = variant.mood?.toLowerCase() ?? '';
  if (
    mood.includes('dark') ||
    mood.includes('night') ||
    mood.includes('moody') ||
    mood.includes('luxury')
  ) {
    return 'onDark';
  }
  if (mood.includes('light') || mood.includes('bright') || mood.includes('clean')) {
    return 'onLight';
  }
  // Default to onDark — most ad backgrounds are darker overlays
  return 'onDark';
}

function pickHeadlinePosition(layout: VariantLayout): TextPosition {
  switch (layout) {
    case 'top-heavy':
    case 'editorial':
      return 'top';
    case 'centered':
    case 'hero':
      return 'center';
    case 'bottom-heavy':
    case 'classic':
      return 'bottom';
    default:
      return 'top';
  }
}

function pickHeadlineAlign(layout: VariantLayout): TextAlign {
  switch (layout) {
    case 'centered':
    case 'hero':
    case 'minimal':
      return 'center';
    case 'editorial':
    case 'magazine':
      return 'left';
    default:
      return 'left';
  }
}

function pickCtaStyle(layout: VariantLayout): CTAStyle {
  switch (layout) {
    case 'brutalist':
    case 'magazine':
      return 'bar';
    case 'minimal':
    case 'editorial':
      return 'pill';
    default:
      return 'pill';
  }
}

function mapLogoPosition(pos: VariantLogoPosition | undefined): LogoCorner {
  if (!pos) return 'bottom-right';
  // VariantLogoPosition is your enum; LogoCorner is composer's
  switch (pos) {
    case 'top-left':
      return 'top-left';
    case 'top-right':
      return 'top-right';
    case 'bottom-left':
      return 'bottom-left';
    case 'bottom-right':
      return 'bottom-right';
    case 'center':
      return 'top-right'; // composer doesn't support center, default
    default:
      return 'bottom-right';
  }
}
