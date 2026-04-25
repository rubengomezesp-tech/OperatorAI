/**
 * ════════════════════════════════════════════════════════════════
 * Operator AI — Premium Composer
 * Phase 1.2 / SVG CTA Renderer
 * ════════════════════════════════════════════════════════════════
 *
 * Renders the Call-to-Action button in 4 styles:
 * - pill:      rounded full-radius button with bg fill
 * - rect:      sharp 6px-radius button (modern flat)
 * - underline: text + underline only (no bg, ghost-like)
 * - ghost:     1px border, transparent bg, brand-color text
 *
 * Returns SVG buffer ready for Sharp.composite().
 */

import type { BrandKit, PlanCta } from './types';
import { resolveColor, resolveFont } from './types';
import { escapeXml, pctToPx, wrapSvg, normalizeHex, estimateTextWidth } from './utils';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface RenderCtaOptions {
  /** Total canvas height (used to scale CTA from preset) */
  canvasHeight: number;
  /** Brand kit */
  brandKit: BrandKit;
  /** Optional override of CTA height in px */
  heightPx?: number;
  /** Optional override of CTA padding-x in px */
  paddingXPx?: number;
  /** Optional override of CTA font-size in px */
  fontSizePx?: number;
}

export interface RenderCtaResult {
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * Render a CTA button as SVG.
 * Auto-sizes width to fit the text with padding.
 */
export function renderCtaSvg(cta: PlanCta, options: RenderCtaOptions): RenderCtaResult {
  // Default sizing — height is ~5% of canvas, font is ~2.5%
  const heightPx = options.heightPx ?? pctToPx(5, options.canvasHeight, 40, 100);
  const fontSizePx = options.fontSizePx ?? Math.round(heightPx * 0.45);
  const paddingXPx = options.paddingXPx ?? Math.round(heightPx * 0.85);

  const font = resolveFont(options.brandKit, 'primary');
  const bgColor = normalizeHex(resolveColor(options.brandKit, cta.bgColorRole));
  const textColor = normalizeHex(resolveColor(options.brandKit, cta.textColorRole));

  // Estimate width — use slightly higher factor for button copy (often bold)
  const textWidth = estimateTextWidth(cta.text, fontSizePx, 0.6);
  const totalWidth = textWidth + paddingXPx * 2;

  switch (cta.style) {
    case 'pill':
      return renderPill({
        text: cta.text,
        width: totalWidth,
        height: heightPx,
        fontSizePx,
        fontFamily: font.family,
        fontFallback: font.fallback ?? 'system-ui, sans-serif',
        fontUrl: font.woff2Url,
        bgColor,
        textColor,
      });

    case 'rect':
      return renderRect({
        text: cta.text,
        width: totalWidth,
        height: heightPx,
        fontSizePx,
        fontFamily: font.family,
        fontFallback: font.fallback ?? 'system-ui, sans-serif',
        fontUrl: font.woff2Url,
        bgColor,
        textColor,
      });

    case 'ghost':
      return renderGhost({
        text: cta.text,
        width: totalWidth,
        height: heightPx,
        fontSizePx,
        fontFamily: font.family,
        fontFallback: font.fallback ?? 'system-ui, sans-serif',
        fontUrl: font.woff2Url,
        textColor: bgColor, // for ghost, "bgColor" becomes border + text accent
      });

    case 'underline':
      return renderUnderline({
        text: cta.text,
        height: heightPx,
        fontSizePx,
        fontFamily: font.family,
        fontFallback: font.fallback ?? 'system-ui, sans-serif',
        fontUrl: font.woff2Url,
        textColor: bgColor, // for underline, use bg color as text+line
      });

    default:
      return renderPill({
        text: cta.text,
        width: totalWidth,
        height: heightPx,
        fontSizePx,
        fontFamily: font.family,
        fontFallback: font.fallback ?? 'system-ui, sans-serif',
        fontUrl: font.woff2Url,
        bgColor,
        textColor,
      });
  }
}

// ────────────────────────────────────────────────────────────────
// STYLE: PILL (default for ads — best CTR per Meta studies)
// ────────────────────────────────────────────────────────────────

interface BaseRenderParams {
  text: string;
  width?: number;
  height: number;
  fontSizePx: number;
  fontFamily: string;
  fontFallback: string;
  fontUrl?: string;
}

interface PillParams extends BaseRenderParams {
  width: number;
  bgColor: string;
  textColor: string;
}

function renderPill(p: PillParams): RenderCtaResult {
  const radius = p.height / 2;
  const fontFaceCss = buildFontFaceCss(p.fontUrl);
  const effectiveFamily = p.fontUrl
    ? `'BrandCta', '${p.fontFamily}', ${p.fontFallback}`
    : `'${p.fontFamily}', ${p.fontFallback}`;

  const defs = `<style>
    ${fontFaceCss}
    .cta-text {
      font-family: ${effectiveFamily};
      font-size: ${p.fontSizePx}px;
      font-weight: 600;
      fill: ${p.textColor};
      letter-spacing: 0;
    }
  </style>`;

  const inner = `
    <rect x="0" y="0" width="${p.width}" height="${p.height}" rx="${radius}" ry="${radius}" fill="${p.bgColor}" />
    <text x="${p.width / 2}" y="${p.height / 2 + p.fontSizePx / 3}" class="cta-text" text-anchor="middle">${escapeXml(p.text)}</text>
  `;

  return {
    buffer: Buffer.from(wrapSvg(p.width, p.height, inner, defs), 'utf-8'),
    width: p.width,
    height: p.height,
  };
}

// ────────────────────────────────────────────────────────────────
// STYLE: RECT (modern flat — used by Vercel, Linear)
// ────────────────────────────────────────────────────────────────

function renderRect(p: PillParams): RenderCtaResult {
  const radius = 8;
  const fontFaceCss = buildFontFaceCss(p.fontUrl);
  const effectiveFamily = p.fontUrl
    ? `'BrandCta', '${p.fontFamily}', ${p.fontFallback}`
    : `'${p.fontFamily}', ${p.fontFallback}`;

  const defs = `<style>
    ${fontFaceCss}
    .cta-text {
      font-family: ${effectiveFamily};
      font-size: ${p.fontSizePx}px;
      font-weight: 600;
      fill: ${p.textColor};
    }
  </style>`;

  const inner = `
    <rect x="0" y="0" width="${p.width}" height="${p.height}" rx="${radius}" ry="${radius}" fill="${p.bgColor}" />
    <text x="${p.width / 2}" y="${p.height / 2 + p.fontSizePx / 3}" class="cta-text" text-anchor="middle">${escapeXml(p.text)}</text>
  `;

  return {
    buffer: Buffer.from(wrapSvg(p.width, p.height, inner, defs), 'utf-8'),
    width: p.width,
    height: p.height,
  };
}

// ────────────────────────────────────────────────────────────────
// STYLE: GHOST (transparent + border — minimalist)
// ────────────────────────────────────────────────────────────────

interface GhostParams extends BaseRenderParams {
  width: number;
  textColor: string;
}

function renderGhost(p: GhostParams): RenderCtaResult {
  const radius = 8;
  const fontFaceCss = buildFontFaceCss(p.fontUrl);
  const effectiveFamily = p.fontUrl
    ? `'BrandCta', '${p.fontFamily}', ${p.fontFallback}`
    : `'${p.fontFamily}', ${p.fontFallback}`;

  const defs = `<style>
    ${fontFaceCss}
    .cta-text {
      font-family: ${effectiveFamily};
      font-size: ${p.fontSizePx}px;
      font-weight: 500;
      fill: ${p.textColor};
    }
  </style>`;

  const inner = `
    <rect x="1" y="1" width="${p.width - 2}" height="${p.height - 2}" rx="${radius}" ry="${radius}" fill="none" stroke="${p.textColor}" stroke-width="2" />
    <text x="${p.width / 2}" y="${p.height / 2 + p.fontSizePx / 3}" class="cta-text" text-anchor="middle">${escapeXml(p.text)}</text>
  `;

  return {
    buffer: Buffer.from(wrapSvg(p.width, p.height, inner, defs), 'utf-8'),
    width: p.width,
    height: p.height,
  };
}

// ────────────────────────────────────────────────────────────────
// STYLE: UNDERLINE (text-only, line under)
// ────────────────────────────────────────────────────────────────

interface UnderlineParams extends BaseRenderParams {
  textColor: string;
}

function renderUnderline(p: UnderlineParams): RenderCtaResult {
  const fontFaceCss = buildFontFaceCss(p.fontUrl);
  const effectiveFamily = p.fontUrl
    ? `'BrandCta', '${p.fontFamily}', ${p.fontFallback}`
    : `'${p.fontFamily}', ${p.fontFallback}`;

  const textWidth = estimateTextWidth(p.text, p.fontSizePx, 0.6);
  const width = textWidth + 8;
  const arrowOffset = 8;

  const defs = `<style>
    ${fontFaceCss}
    .cta-text {
      font-family: ${effectiveFamily};
      font-size: ${p.fontSizePx}px;
      font-weight: 600;
      fill: ${p.textColor};
    }
  </style>`;

  const baselineY = p.height / 2 + p.fontSizePx / 3;
  const underlineY = baselineY + 6;

  const inner = `
    <text x="0" y="${baselineY}" class="cta-text">${escapeXml(p.text)}</text>
    <line x1="0" y1="${underlineY}" x2="${textWidth}" y2="${underlineY}" stroke="${p.textColor}" stroke-width="2" />
    <text x="${textWidth + arrowOffset}" y="${baselineY}" class="cta-text">→</text>
  `;

  return {
    buffer: Buffer.from(wrapSvg(width + arrowOffset + p.fontSizePx, p.height, inner, defs), 'utf-8'),
    width: width + arrowOffset + p.fontSizePx,
    height: p.height,
  };
}

// ────────────────────────────────────────────────────────────────
// HELPER
// ────────────────────────────────────────────────────────────────

function buildFontFaceCss(fontUrl: string | undefined): string {
  if (!fontUrl) return '';
  return `
    @font-face {
      font-family: 'BrandCta';
      src: url('${fontUrl}') format('woff2');
      font-display: block;
    }
  `;
}
