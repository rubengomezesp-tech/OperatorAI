/**
 * ════════════════════════════════════════════════════════════════
 * Operator AI — Premium Composer
 * Phase 1.2 / SVG Logo Renderer
 * ════════════════════════════════════════════════════════════════
 *
 * Handles logo placement on the canvas:
 * - Fetches logo from URL (PNG/SVG/JPG)
 * - Resizes to fit maxWidthPct
 * - Computes (x, y) from position + paddingPct + safe zone
 * - Returns Sharp-ready logo buffer + position
 *
 * CTO note:
 * - Uses `fetch` to download — no extra deps.
 * - On fetch failure, returns null instead of crashing.
 * - Sharp handles PNG/JPG/WebP/SVG natively.
 */

import type { BrandKit, FormatPreset, LogoPosition, PlanLogo } from './types';
import { pctToPxW, pctToPx } from './utils';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface LogoPlacement {
  /** Logo image bytes ready for Sharp.composite() */
  buffer: Buffer;
  /** Source MIME type (for diagnostics) */
  contentType: string;
  /** Final logo width in px (after maxWidthPct scaling) */
  width: number;
  /** Computed top-left x coord on the canvas */
  x: number;
  /** Computed top-left y coord on the canvas */
  y: number;
}

/**
 * Fetch + place logo, returning placement coords.
 * Returns null if logoUrl is missing or fetch fails.
 */
export async function preparelogoPlacement(
  brandKit: BrandKit,
  plan: PlanLogo,
  preset: FormatPreset,
  /** Optional: max time (ms) to wait for fetch before giving up */
  fetchTimeoutMs = 8000
): Promise<LogoPlacement | null> {
  if (!brandKit.logoUrl) {
    return null;
  }

  // Fetch logo with timeout
  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
    response = await fetch(brandKit.logoUrl, { signal: controller.signal });
    clearTimeout(timeout);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[composer] Logo fetch failed: ${(err as Error).message}`);
    return null;
  }

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.warn(`[composer] Logo fetch returned ${response.status}`);
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') ?? 'image/png';

  // Compute target width and position
  const targetWidth = pctToPxW(plan.maxWidthPct, preset.width, 60, preset.width / 2);
  const padding = pctToPxW(plan.paddingPct, preset.width, 16, preset.width / 4);
  const { x, y } = computeLogoPosition(plan.position, preset, targetWidth, padding);

  return {
    buffer,
    contentType,
    width: targetWidth,
    x,
    y,
  };
}

// ────────────────────────────────────────────────────────────────
// POSITION CALCULATOR
// ────────────────────────────────────────────────────────────────

/**
 * Compute top-left (x, y) for the logo based on its position keyword.
 *
 * Note: We assume logo height is approximately 50% of width (1:2 ratio
 * common for wordmarks). If the actual logo is square, this still
 * works — the logo just has more vertical breathing room.
 *
 * For perfect placement, Sharp's `composite()` accepts the actual
 * logo height; we recalculate vertical offset there if needed.
 */
function computeLogoPosition(
  position: LogoPosition,
  preset: FormatPreset,
  logoWidth: number,
  padding: number
): { x: number; y: number } {
  const estLogoHeight = Math.round(logoWidth * 0.5); // assumption — actual recalc in composer.ts

  // Use safe zone — logos NEVER go outside it
  const safeLeft = preset.safeZone.left;
  const safeRight = preset.width - preset.safeZone.right;
  const safeTop = preset.safeZone.top;
  const safeBottom = preset.height - preset.safeZone.bottom;

  // Top
  const topY = safeTop + padding;
  // Bottom
  const bottomY = safeBottom - estLogoHeight - padding;
  // Center vertically
  const centerY = (preset.height - estLogoHeight) / 2;

  // Left
  const leftX = safeLeft + padding;
  // Right
  const rightX = safeRight - logoWidth - padding;
  // Center horizontally
  const centerX = (preset.width - logoWidth) / 2;

  switch (position) {
    case 'top-left':
      return { x: leftX, y: topY };
    case 'top-right':
      return { x: rightX, y: topY };
    case 'top-center':
      return { x: centerX, y: topY };
    case 'bottom-left':
      return { x: leftX, y: bottomY };
    case 'bottom-right':
      return { x: rightX, y: bottomY };
    case 'bottom-center':
      return { x: centerX, y: bottomY };
    case 'center':
      return { x: centerX, y: centerY };
    default:
      return { x: leftX, y: topY };
  }
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

/**
 * Validate that a logo URL is publicly fetchable.
 * Used by Brand OS validation in Phase 3.
 */
export async function validateLogoUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}` };
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return { valid: false, error: `Not an image (${contentType})` };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}
