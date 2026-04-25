/**
 * ════════════════════════════════════════════════════════════════
 * Operator AI — Premium Composer
 * Phase 1.2 / SVG Text Renderer
 * ════════════════════════════════════════════════════════════════
 *
 * Renders headline and subheadline text as SVG.
 * Critical capabilities:
 * - Loads WOFF2 brand fonts via @font-face (Sharp+librsvg supports this)
 * - Word-wraps text to fit safe zone width
 * - Applies brand colors exactly (hex)
 * - Returns SVG buffer for Sharp.composite()
 *
 * CTO note: librsvg honors @font-face IF the font URL is publicly
 * accessible. For private fonts, use embedded base64 (heavier).
 */

import type { BrandKit, PlanHeadline, PlanSubhead } from './types';
import { resolveColor, resolveFont } from './types';
import {
  escapeXml,
  pctToPx,
  wrapText,
  wrapSvg,
  estimateTextWidth,
  normalizeHex,
} from './utils';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface RenderTextOptions {
  /** Total width of the SVG container in px (= canvas safe-area width) */
  width: number;
  /** Total height of the canvas in px (used to scale font from sizePct) */
  canvasHeight: number;
  /** Brand kit for color + font resolution */
  brandKit: BrandKit;
}

export interface RenderTextResult {
  /** UTF-8 SVG document as Buffer (Sharp accepts Buffer) */
  buffer: Buffer;
  /** SVG width (matches input) */
  width: number;
  /** Computed SVG height (depends on number of wrapped lines) */
  height: number;
  /** Final font-size in px (after wrap) */
  fontSizePx: number;
  /** Number of lines after wrapping */
  lines: number;
}

/**
 * Render a headline (display font, large, bold).
 */
export function renderHeadlineSvg(
  headline: PlanHeadline,
  options: RenderTextOptions
): RenderTextResult {
  const font = resolveFont(options.brandKit, headline.fontRole);
  const color = normalizeHex(resolveColor(options.brandKit, headline.colorRole));
  const fontSize = pctToPx(headline.sizePct, options.canvasHeight, 24, 200);

  return renderTextBlock({
    text: headline.text,
    fontFamily: font.family,
    fontFallback: font.fallback ?? 'system-ui, -apple-system, sans-serif',
    fontUrl: font.woff2Url,
    fontWeight: font.weight ?? 700,
    italic: font.italic ?? false,
    fontSizePx: fontSize,
    color,
    align: headline.align,
    width: options.width,
    lineHeightFactor: 1.1, // tight for headlines
    letterSpacing: -0.02, // -2% for display tracking
  });
}

/**
 * Render a subheadline (smaller, primary font, lighter weight).
 */
export function renderSubheadSvg(
  subhead: PlanSubhead,
  options: RenderTextOptions
): RenderTextResult {
  const font = resolveFont(options.brandKit, subhead.fontRole);
  const color = normalizeHex(resolveColor(options.brandKit, subhead.colorRole));
  const fontSize = pctToPx(subhead.sizePct, options.canvasHeight, 14, 100);

  return renderTextBlock({
    text: subhead.text,
    fontFamily: font.family,
    fontFallback: font.fallback ?? 'system-ui, -apple-system, sans-serif',
    fontUrl: font.woff2Url,
    fontWeight: font.weight ?? 400,
    italic: font.italic ?? false,
    fontSizePx: fontSize,
    color,
    align: subhead.align,
    width: options.width,
    lineHeightFactor: 1.35, // looser for body
    letterSpacing: 0,
  });
}

// ────────────────────────────────────────────────────────────────
// CORE RENDERER
// ────────────────────────────────────────────────────────────────

interface TextBlockParams {
  text: string;
  fontFamily: string;
  fontFallback: string;
  fontUrl?: string;
  fontWeight: number;
  italic: boolean;
  fontSizePx: number;
  color: string;
  align: 'left' | 'center' | 'right';
  width: number;
  lineHeightFactor: number;
  letterSpacing: number; // em
}

function renderTextBlock(p: TextBlockParams): RenderTextResult {
  // Estimate average chars per line for naive wrap
  const avgCharWidth = p.fontSizePx * 0.55;
  const maxCharsPerLine = Math.max(8, Math.floor(p.width / avgCharWidth));
  const lines = wrapText(p.text, maxCharsPerLine);

  const lineHeight = Math.round(p.fontSizePx * p.lineHeightFactor);
  const totalHeight = lines.length * lineHeight + Math.round(p.fontSizePx * 0.3);

  // Build @font-face if URL provided
  const fontFaceCss = p.fontUrl
    ? `
      @font-face {
        font-family: 'BrandText';
        src: url('${p.fontUrl}') format('woff2');
        font-weight: ${p.fontWeight};
        font-style: ${p.italic ? 'italic' : 'normal'};
        font-display: block;
      }
    `
    : '';

  const effectiveFamily = p.fontUrl
    ? `'BrandText', '${p.fontFamily}', ${p.fontFallback}`
    : `'${p.fontFamily}', ${p.fontFallback}`;

  const defs = `<style>
    ${fontFaceCss}
    .t {
      font-family: ${effectiveFamily};
      font-size: ${p.fontSizePx}px;
      font-weight: ${p.fontWeight};
      font-style: ${p.italic ? 'italic' : 'normal'};
      fill: ${p.color};
      letter-spacing: ${p.letterSpacing}em;
    }
  </style>`;

  // Build text elements per line
  let xPos = 0;
  let textAnchor = 'start';
  if (p.align === 'center') {
    xPos = p.width / 2;
    textAnchor = 'middle';
  } else if (p.align === 'right') {
    xPos = p.width;
    textAnchor = 'end';
  }

  const textLines = lines
    .map((line, i) => {
      const y = (i + 1) * lineHeight;
      return `<text x="${xPos}" y="${y}" class="t" text-anchor="${textAnchor}">${escapeXml(line)}</text>`;
    })
    .join('\n');

  const svg = wrapSvg(p.width, totalHeight, textLines, defs);

  return {
    buffer: Buffer.from(svg, 'utf-8'),
    width: p.width,
    height: totalHeight,
    fontSizePx: p.fontSizePx,
    lines: lines.length,
  };
}

// ────────────────────────────────────────────────────────────────
// DEBUG: render a headline string outside of a CreativePlan
// ────────────────────────────────────────────────────────────────
// Useful for unit tests in Phase 1.3.

export function debugRenderHeadline(text: string, kit: BrandKit, canvasHeight = 1350): RenderTextResult {
  return renderHeadlineSvg(
    {
      text,
      fontRole: 'display',
      sizePct: 8,
      colorRole: 'onDark',
      position: 'top',
      align: 'left',
    },
    { width: 920, canvasHeight, brandKit: kit }
  );
}
