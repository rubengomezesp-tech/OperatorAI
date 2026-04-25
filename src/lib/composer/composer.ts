/**
 * Operator AI — Premium Composer
 * Phase 1.3 / Sharp Engine
 *
 * Orchestrates: background → optional darken overlay → text → CTA → logo
 * Returns final PNG/JPEG buffer ready to upload.
 */

import sharp from 'sharp';
import type {
  BrandKit,
  ComposerOutput,
  CreativePlan,
  FormatPreset,
} from './types';
import { resolveColor } from './types';
import { getDefaultPresetForPlatform, getPresetById, getSafeArea } from './presets';
import { renderHeadlineSvg, renderSubheadSvg } from './svg-text';
import { renderCtaSvg } from './svg-cta';
import { preparelogoPlacement } from './svg-logo';
import { normalizeHex } from './utils';

const COMPOSER_VERSION = '1.0.0';

export interface ComposeOptions {
  brandKit: BrandKit;
  plan: CreativePlan;
  /** Optional explicit preset; otherwise computed from plan.platform */
  preset?: FormatPreset;
  /** Output format (default png) */
  outputFormat?: 'png' | 'jpeg';
  /** JPEG quality 1-100 (default 92) */
  jpegQuality?: number;
}

/**
 * Main entry point. Composes a final ad image.
 */
export async function composeAd(options: ComposeOptions): Promise<ComposerOutput> {
  const start = Date.now();
  const preset =
    options.preset ??
    (options.plan.formatId
      ? getPresetById(options.plan.formatId)
      : getDefaultPresetForPlatform(options.plan.platform));

  // 1. Fetch background image
  const bgBuffer = await fetchImageBuffer(options.plan.background.imageUrl);

  // 2. Resize to canvas dimensions
  let canvas = sharp(bgBuffer).resize(preset.width, preset.height, {
    fit: 'cover',
    position: 'center',
  });

  // 3. Apply darken overlay if requested
  if (options.plan.background.darken) {
    const darkenBuffer = await buildDarkenOverlay(preset, options.plan.background.darken);
    canvas = canvas.composite([{ input: darkenBuffer, top: 0, left: 0 }]);
    // Re-instantiate sharp from current state to allow further composites
    const intermediate = await canvas.png().toBuffer();
    canvas = sharp(intermediate);
  }

  // 4. Build composite layers (text, CTA, logo)
  const overlays: sharp.OverlayOptions[] = [];
  const safeArea = getSafeArea(preset);

  // 4a. Headline
  const headline = renderHeadlineSvg(options.plan.headline, {
    width: safeArea.width,
    canvasHeight: preset.height,
    brandKit: options.brandKit,
  });
  const headlineY = computeVerticalPosition(
    options.plan.headline.position,
    safeArea,
    headline.height
  );
  overlays.push({
    input: headline.buffer,
    top: headlineY,
    left: safeArea.x,
  });

  // 4b. Subhead (placed below headline)
  if (options.plan.subhead) {
    const subhead = renderSubheadSvg(options.plan.subhead, {
      width: safeArea.width,
      canvasHeight: preset.height,
      brandKit: options.brandKit,
    });
    const subheadY = headlineY + headline.height + Math.round(headline.fontSizePx * 0.3);
    overlays.push({
      input: subhead.buffer,
      top: subheadY,
      left: safeArea.x,
    });
  }

  // 4c. CTA (bottom-right of safe area by default)
  if (options.plan.cta) {
    const cta = renderCtaSvg(options.plan.cta, {
      canvasHeight: preset.height,
      brandKit: options.brandKit,
    });
    const ctaPaddingFromEdge = Math.round(preset.width * 0.04);
    overlays.push({
      input: cta.buffer,
      top: safeArea.y + safeArea.height - cta.height - ctaPaddingFromEdge,
      left: safeArea.x + safeArea.width - cta.width - ctaPaddingFromEdge,
    });
  }

  // 4d. Logo
  if (options.plan.logo) {
    const logoPlacement = await preparelogoPlacement(
      options.brandKit,
      options.plan.logo,
      preset
    );
    if (logoPlacement) {
      // Resize logo to target width preserving aspect ratio
      const resizedLogo = await sharp(logoPlacement.buffer)
        .resize({ width: logoPlacement.width, withoutEnlargement: false })
        .png()
        .toBuffer();
      overlays.push({
        input: resizedLogo,
        top: logoPlacement.y,
        left: logoPlacement.x,
      });
    }
  }

  // 5. Composite everything
  const finalBuffer = await canvas
    .composite(overlays)
    [options.outputFormat ?? 'png']({
      quality: options.jpegQuality ?? 92,
    })
    .toBuffer();

  return {
    buffer: finalBuffer,
    contentType: options.outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
    width: preset.width,
    height: preset.height,
    plan: options.plan,
    preset,
    meta: {
      composerVersion: COMPOSER_VERSION,
      generatedAtMs: start,
      durationMs: Date.now() - start,
    },
  };
}

/**
 * Compose the same plan across multiple format presets.
 * Used by Phase 5 for one-brief-many-formats export.
 */
export async function composeMultiFormat(
  brandKit: BrandKit,
  plan: CreativePlan,
  presetIds: string[]
): Promise<ComposerOutput[]> {
  const results = await Promise.all(
    presetIds.map((id) =>
      composeAd({
        brandKit,
        plan,
        preset: getPresetById(id),
      })
    )
  );
  return results;
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

async function fetchImageBuffer(url: string, timeoutMs = 15000): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Image fetch failed: HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`Failed to fetch background image: ${(err as Error).message}`);
  }
}

async function buildDarkenOverlay(
  preset: FormatPreset,
  darken: NonNullable<CreativePlan['background']['darken']>
): Promise<Buffer> {
  const alpha = Math.max(0, Math.min(1, darken.amount));
  const opacityHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');

  let svg: string;
  if (darken.region === 'full') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${preset.width}" height="${preset.height}">
      <rect width="100%" height="100%" fill="#000000${opacityHex}" />
    </svg>`;
  } else if (darken.region === 'top') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${preset.width}" height="${preset.height}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="${alpha}" />
        <stop offset="100%" stop-color="#000" stop-opacity="0" />
      </linearGradient></defs>
      <rect width="100%" height="50%" fill="url(#g)" />
    </svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${preset.width}" height="${preset.height}">
      <defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#000" stop-opacity="${alpha}" />
        <stop offset="100%" stop-color="#000" stop-opacity="0" />
      </linearGradient></defs>
      <rect y="50%" width="100%" height="50%" fill="url(#g)" />
    </svg>`;
  }

  return Buffer.from(svg, 'utf-8');
}

function computeVerticalPosition(
  position: 'top' | 'center' | 'bottom',
  safeArea: { x: number; y: number; width: number; height: number },
  blockHeight: number
): number {
  switch (position) {
    case 'top':
      return safeArea.y;
    case 'center':
      return safeArea.y + (safeArea.height - blockHeight) / 2;
    case 'bottom':
      return safeArea.y + safeArea.height - blockHeight - 80;
    default:
      return safeArea.y;
  }
}
