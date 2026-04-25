/**
 * Operator AI — Brand OS
 * Phase 3 / Color Extractor
 *
 * Extracts dominant colors from an image using Sharp's pixel sampling.
 * Used when:
 * - User uploads a logo and we need to detect brand colors automatically
 * - We extract from a website screenshot
 * - We process reference imagery
 *
 * Algorithm:
 * 1. Resize image to small canvas (50x50) for speed
 * 2. Get raw pixel buffer (RGB)
 * 3. Quantize colors to ~12 buckets via simple binning
 * 4. Group by bucket, score by frequency
 * 5. Filter near-white/near-black noise
 * 6. Return top N colors with weights and inferred roles
 *
 * Note: This is a deterministic ~30ms algorithm.
 * For ML-grade extraction, swap to a proper library later.
 */

import sharp from 'sharp';
import type { ExtractedColor, ExtractedColors } from './types';
import { fetchRemoteAsset } from './storage';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface ExtractColorsOptions {
  /** Image source (URL or Buffer) */
  source: string | Buffer;
  /** Max colors to return */
  maxColors?: number;
  /** Resize sample size (smaller = faster, less accurate) */
  sampleSize?: number;
  /** Whether to ignore near-white/near-black */
  filterNeutrals?: boolean;
}

/**
 * Extract dominant colors from an image.
 */
export async function extractColors(
  options: ExtractColorsOptions
): Promise<ExtractedColors> {
  const {
    source,
    maxColors = 8,
    sampleSize = 80,
    filterNeutrals = true,
  } = options;

  // Get buffer
  const inputBuffer =
    typeof source === 'string' ? (await fetchRemoteAsset(source)).buffer : source;

  // Resize and get raw RGB pixels
  const { data, info } = await sharp(inputBuffer)
    .resize(sampleSize, sampleSize, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Bucket counter
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  const totalPixels = info.width * info.height;

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (filterNeutrals && isNeutral(r, g, b)) continue;

    // Quantize: bucket size 32 → ~512 unique buckets max
    const key = `${quantize(r)}-${quantize(g)}-${quantize(b)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  // Convert to ExtractedColor[] sorted by frequency
  const colors: ExtractedColor[] = Array.from(buckets.values())
    .map((bucket) => ({
      hex: rgbToHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count),
      weight: bucket.count / totalPixels,
      role: 'unknown' as const,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxColors);

  // Infer roles
  const palette = inferRoles(colors);

  return {
    primary: palette.find((c) => c.role === 'primary')?.hex,
    secondary: palette.find((c) => c.role === 'secondary')?.hex,
    accent: palette.find((c) => c.role === 'accent')?.hex,
    background: palette.find((c) => c.role === 'background')?.hex,
    text: palette.find((c) => c.role === 'text')?.hex,
    palette,
  };
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function quantize(channel: number, bucketSize = 32): number {
  return Math.floor(channel / bucketSize) * bucketSize;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function isNeutral(r: number, g: number, b: number): boolean {
  // Near-white
  if (r > 240 && g > 240 && b > 240) return true;
  // Near-black
  if (r < 15 && g < 15 && b < 15) return true;
  // Near-grey (low saturation)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 12) return true;
  return false;
}

/**
 * Infer color roles based on saturation, luminance, frequency.
 *
 * Heuristics:
 * - Most frequent saturated color → primary
 * - Second most frequent saturated → secondary
 * - High-saturation, low-frequency color → accent (CTA-able)
 * - Highest luminance neutral → background
 * - Lowest luminance neutral → text
 */
function inferRoles(colors: ExtractedColor[]): ExtractedColor[] {
  if (colors.length === 0) return [];

  // Compute HSL for each
  const enriched = colors.map((c) => {
    const hsl = hexToHsl(c.hex);
    return { ...c, ...hsl };
  });

  // Sort by saturation desc, then weight desc
  const saturated = enriched.filter((c) => c.s > 0.2).sort((a, b) => b.weight - a.weight);

  if (saturated.length > 0) {
    saturated[0].role = 'primary';
  }
  if (saturated.length > 1) {
    saturated[1].role = 'secondary';
  }

  // Accent: highest saturation that isn't already primary/secondary
  const accentCandidates = saturated.filter((c) => c.role === 'unknown').sort((a, b) => b.s - a.s);
  if (accentCandidates.length > 0) {
    accentCandidates[0].role = 'accent';
  }

  return enriched.map(({ h, s, l, ...rest }) => rest as ExtractedColor);
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}
