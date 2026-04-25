/**
 * ════════════════════════════════════════════════════════════════
 * Operator AI — Premium Composer
 * Phase 1.2 / Utilities
 * ════════════════════════════════════════════════════════════════
 *
 * Pure helpers used across SVG renderers.
 * Zero dependencies, zero side effects.
 */

// ────────────────────────────────────────────────────────────────
// XML / SVG escaping
// ────────────────────────────────────────────────────────────────

/**
 * Escape user-controlled text for safe SVG insertion.
 * Critical: brand names and copy can contain &, <, >, etc.
 */
export function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

// ────────────────────────────────────────────────────────────────
// Color helpers
// ────────────────────────────────────────────────────────────────

/**
 * Validate and normalize a hex color.
 * Accepts: #FFF, #FFFFFF, #FFFFFFFF (with alpha)
 * Returns the normalized 6-digit hex with #.
 * Falls back to #000000 if invalid (with console warning).
 */
export function normalizeHex(input: string | undefined, fallback = '#000000'): string {
  if (!input) return fallback;

  const trimmed = input.trim();
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(trimmed);

  if (!match) {
    // eslint-disable-next-line no-console
    console.warn(`[composer] Invalid hex color "${input}", using ${fallback}`);
    return fallback;
  }

  let hex = match[1];

  // Expand 3-digit to 6-digit
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  // Drop alpha channel if present (Sharp doesn't always honor it well)
  if (hex.length === 8) {
    hex = hex.substring(0, 6);
  }

  return `#${hex.toUpperCase()}`;
}

/**
 * Compute relative luminance of a hex color (0..1).
 * Used to decide whether to put light or dark text on top.
 */
export function luminance(hex: string): number {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.substring(1, 3), 16) / 255;
  const g = parseInt(normalized.substring(3, 5), 16) / 255;
  const b = parseInt(normalized.substring(5, 7), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Returns true if the color is "dark" (luminance below 0.5) */
export function isDark(hex: string): boolean {
  return luminance(hex) < 0.5;
}

// ────────────────────────────────────────────────────────────────
// Sizing & wrapping
// ────────────────────────────────────────────────────────────────

/**
 * Compute font size in pixels from a percentage of canvas height.
 * Clamped to a sensible min/max for legibility.
 */
export function pctToPx(pct: number, canvasHeight: number, min = 16, max = 240): number {
  const px = Math.round((pct / 100) * canvasHeight);
  return Math.max(min, Math.min(max, px));
}

/**
 * Convert a percentage of canvas width to pixels.
 */
export function pctToPxW(pct: number, canvasWidth: number, min = 1, max = 9999): number {
  const px = Math.round((pct / 100) * canvasWidth);
  return Math.max(min, Math.min(max, px));
}

/**
 * Estimate text width (px) given a font-size and avg char-width factor.
 * Used for layout when we don't have a real font metric.
 *
 * Note: This is a rough approximation. For perfect kerning,
 * Sharp + librsvg handle final rendering correctly.
 */
export function estimateTextWidth(text: string, fontSizePx: number, weightFactor = 0.55): number {
  return Math.round(text.length * fontSizePx * weightFactor);
}

/**
 * Naive word-wrap: returns lines that fit within maxWidth (in chars).
 * For real font-aware wrapping, switch to satori or a proper text shaper later.
 */
export function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

// ────────────────────────────────────────────────────────────────
// SVG document wrapper
// ────────────────────────────────────────────────────────────────

/**
 * Wraps inner SVG content in a properly-formed SVG document with
 * an XML namespace. Required by librsvg/Sharp.
 */
export function wrapSvg(width: number, height: number, inner: string, defs = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${defs ? `<defs>${defs}</defs>` : ''}
${inner}
</svg>`;
}
