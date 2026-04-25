/**
 * ════════════════════════════════════════════════════════════════
 * Operator AI — Premium Composer
 * Phase 1 / File 1 of 4 — Type definitions
 * ════════════════════════════════════════════════════════════════
 *
 * This file is the SINGLE SOURCE OF TRUTH for composer types.
 * Nothing in this file imports from outside. Pure types only.
 *
 * Architecture decision (CTO note):
 * - We define our OWN BrandKit type independent of brand_profile DB row.
 * - The adapter layer (in a future file) will MAP brand_profile → BrandKit.
 * - This means we can change DB schema without breaking composer logic.
 */

// ────────────────────────────────────────────────────────────────
// PLATFORM & FORMAT
// ────────────────────────────────────────────────────────────────

export type Platform =
  | 'instagram_feed'
  | 'instagram_story'
  | 'instagram_reel'
  | 'tiktok'
  | 'meta_ad_square'
  | 'meta_ad_landscape'
  | 'youtube_short'
  | 'twitter_post';

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | '1.91:1';

export interface FormatPreset {
  /** Internal ID, e.g. "instagram_feed_portrait" */
  id: string;
  /** Display name shown to users */
  label: string;
  /** Platform this format belongs to */
  platform: Platform;
  /** Pixel width */
  width: number;
  /** Pixel height */
  height: number;
  /** Aspect ratio for AI model input */
  aspect: AspectRatio;
  /**
   * Safe zone in pixels — areas where critical content
   * (logo, headline, CTA) must NOT be placed.
   * Calculated as offsets from each edge.
   */
  safeZone: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** UI overlay zones (for video platforms with controls visible) */
  uiOverlay?: {
    top?: number;
    bottom?: number;
  };
}

// ────────────────────────────────────────────────────────────────
// BRAND KIT
// ────────────────────────────────────────────────────────────────

export interface BrandColors {
  /** Primary brand color (hex, e.g. "#c9a863") */
  primary: string;
  /** Secondary brand color */
  secondary?: string;
  /** Accent color for CTAs */
  accent?: string;
  /** Color for text on dark backgrounds */
  onDark?: string;
  /** Color for text on light backgrounds */
  onLight?: string;
  /** Default background fill if needed */
  background?: string;
}

export interface BrandFont {
  /** Font family name, e.g. "Inter" */
  family: string;
  /**
   * Optional WOFF2 URL for embedded font rendering.
   * If absent, falls back to web-safe alternatives.
   */
  woff2Url?: string;
  /** Default weight 100-900 */
  weight?: number;
  /** Italic? */
  italic?: boolean;
  /** Optional fallback chain */
  fallback?: string;
}

export interface BrandFonts {
  /** Body text font */
  primary: BrandFont;
  /** Headlines/display font (defaults to primary if absent) */
  display?: BrandFont;
}

export interface BrandKit {
  /** Optional ID — links back to brand_profile.id */
  id?: string;
  /** Org ID for multi-tenant isolation */
  orgId?: string;
  /** Display name of the brand */
  name?: string;
  /**
   * Logo URL — should be a transparent PNG or SVG ideally.
   * If null, composer skips logo placement.
   */
  logoUrl?: string | null;
  /**
   * Brand colors — required `primary` minimum.
   * Composer falls back to defaults if missing.
   */
  colors: BrandColors;
  /** Brand fonts — composer falls back to Inter if missing */
  fonts?: BrandFonts;
  /** Tone of voice (used by AI planner, not composer directly) */
  toneOfVoice?: string;
  /** Industry context */
  industry?: string;
  /** Target audience description */
  targetAudience?: string;
}

// ────────────────────────────────────────────────────────────────
// CREATIVE PLAN
// ────────────────────────────────────────────────────────────────
// What the AI planner produces. The composer consumes this to
// build the final image.

export type SafeZonePosition = 'top' | 'center' | 'bottom';
export type LogoPosition =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'center';
export type CtaStyle = 'pill' | 'rect' | 'underline' | 'ghost';
export type ColorRole = 'primary' | 'secondary' | 'accent' | 'onDark' | 'onLight' | 'background';
export type TextAlign = 'left' | 'center' | 'right';

export interface PlanHeadline {
  text: string;
  /** Which font to use from BrandKit */
  fontRole: 'primary' | 'display';
  /** Font size as percentage of canvas height (5-15%) */
  sizePct: number;
  /** Color token from BrandKit */
  colorRole: ColorRole;
  /** Where in the canvas (top, center, bottom) */
  position: SafeZonePosition;
  /** Horizontal alignment within the safe zone */
  align: TextAlign;
}

export interface PlanSubhead {
  text: string;
  fontRole: 'primary' | 'display';
  sizePct: number;
  colorRole: ColorRole;
  align: TextAlign;
}

export interface PlanCta {
  text: string;
  style: CtaStyle;
  /** Background color of CTA button */
  bgColorRole: ColorRole;
  /** Text color of CTA */
  textColorRole: ColorRole;
}

export interface PlanLogo {
  position: LogoPosition;
  /** Padding from edge as % of canvas width (typically 3-8%) */
  paddingPct: number;
  /** Max width of logo as % of canvas width (typically 15-25%) */
  maxWidthPct: number;
}

export interface PlanBackground {
  /**
   * Image URL of the AI-generated background.
   * Composer overlays text/logo on top of this.
   */
  imageUrl: string;
  /**
   * Optional darkening overlay (0-1) for text legibility.
   * E.g. 0.3 = 30% darken on bottom half.
   */
  darken?: {
    amount: number;
    region: 'top' | 'bottom' | 'full';
  };
}

export interface CreativePlan {
  /** Format/platform this ad targets */
  platform: Platform;
  /** Optional override of preset ID */
  formatId?: string;
  /** AI-generated background */
  background: PlanBackground;
  /** Headline (always required for ads) */
  headline: PlanHeadline;
  /** Optional subheadline */
  subhead?: PlanSubhead;
  /** Call to action button */
  cta?: PlanCta;
  /** Logo placement */
  logo?: PlanLogo;
  /** Optional unique ID for tracking */
  planId?: string;
}

// ────────────────────────────────────────────────────────────────
// COMPOSER OUTPUT
// ────────────────────────────────────────────────────────────────

export interface ComposerOutput {
  /** PNG buffer ready to upload */
  buffer: Buffer;
  /** MIME type, typically "image/png" or "image/jpeg" */
  contentType: 'image/png' | 'image/jpeg';
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Plan that was used */
  plan: CreativePlan;
  /** Format preset that was used */
  preset: FormatPreset;
  /** Generation metadata for debugging */
  meta: {
    composerVersion: string;
    generatedAtMs: number;
    durationMs: number;
  };
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

/** Resolve a color role from a BrandKit, with fallbacks */
export function resolveColor(kit: BrandKit, role: ColorRole): string {
  switch (role) {
    case 'primary':
      return kit.colors.primary;
    case 'secondary':
      return kit.colors.secondary ?? kit.colors.primary;
    case 'accent':
      return kit.colors.accent ?? kit.colors.primary;
    case 'onDark':
      return kit.colors.onDark ?? '#FFFFFF';
    case 'onLight':
      return kit.colors.onLight ?? '#000000';
    case 'background':
      return kit.colors.background ?? '#000000';
    default:
      return kit.colors.primary;
  }
}

/** Resolve a font from a BrandKit, with fallbacks */
export function resolveFont(kit: BrandKit, role: 'primary' | 'display'): BrandFont {
  if (!kit.fonts) {
    return {
      family: 'Inter',
      fallback: 'system-ui, -apple-system, sans-serif',
      weight: role === 'display' ? 700 : 400,
    };
  }
  if (role === 'display') {
    return kit.fonts.display ?? kit.fonts.primary;
  }
  return kit.fonts.primary;
}
