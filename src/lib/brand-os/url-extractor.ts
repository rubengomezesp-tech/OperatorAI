/**
 * Operator AI — Brand OS
 * Phase 3 / URL Brand Extractor
 *
 * Extracts brand identity from a public URL.
 *
 * Strategy:
 * 1. Try Firecrawl (best quality, paid)
 * 2. Fall back to native HTML scraping (free, less reliable)
 *
 * Returns ExtractedBrand with confidence score.
 */

import type { ExtractedBrand } from './types';
import { BrandExtractionError } from './types';
import { extractColors } from './color-extractor';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface ExtractFromUrlOptions {
  url: string;
  /** Force a specific extractor (default: try firecrawl, fall back to scraper) */
  preferredMethod?: 'firecrawl' | 'scraper' | 'auto';
  /** Whether to extract colors from the logo (extra processing time) */
  extractColorsFromLogo?: boolean;
}

/**
 * Extract brand identity from a URL.
 */
export async function extractBrandFromUrl(
  options: ExtractFromUrlOptions
): Promise<ExtractedBrand> {
  const { url, preferredMethod = 'auto', extractColorsFromLogo = true } = options;

  validateUrl(url);

  let result: ExtractedBrand | null = null;
  const warnings: string[] = [];

  // Try Firecrawl first if available and not explicitly skipped
  if (preferredMethod !== 'scraper' && process.env.FIRECRAWL_API_KEY) {
    try {
      result = await extractWithFirecrawl(url);
    } catch (err) {
      warnings.push(`Firecrawl failed: ${(err as Error).message}`);
      if (preferredMethod === 'firecrawl') {
        throw new BrandExtractionError(url, 'Firecrawl extraction failed', err);
      }
    }
  }

  // Fall back to scraper
  if (!result) {
    try {
      result = await extractWithScraper(url);
    } catch (err) {
      throw new BrandExtractionError(url, 'All extraction methods failed', err);
    }
  }

  // Optionally enhance colors by extracting from logo image
  if (extractColorsFromLogo && result.logoUrl) {
    try {
      const enhanced = await extractColors({ source: result.logoUrl, maxColors: 6 });
      // Merge: prefer scraper-detected if confident, else use logo extraction
      if (!result.colors.primary && enhanced.primary) {
        result.colors.primary = enhanced.primary;
      }
      if (!result.colors.secondary && enhanced.secondary) {
        result.colors.secondary = enhanced.secondary;
      }
      if (!result.colors.accent && enhanced.accent) {
        result.colors.accent = enhanced.accent;
      }
      // Always merge palette
      result.colors.palette = [...(result.colors.palette ?? []), ...enhanced.palette];
    } catch (err) {
      warnings.push(`Color enhancement from logo failed: ${(err as Error).message}`);
    }
  }

  result.warnings = [...(result.warnings ?? []), ...warnings];
  return result;
}

// ────────────────────────────────────────────────────────────────
// FIRECRAWL EXTRACTOR
// ────────────────────────────────────────────────────────────────

async function extractWithFirecrawl(url: string): Promise<ExtractedBrand> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY env var is not set');
  }

  // Firecrawl /scrape endpoint with branding format
  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['branding', 'metadata'],
      onlyMainContent: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl returned ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const branding = data?.data?.branding ?? {};
  const metadata = data?.data?.metadata ?? {};

  // Map Firecrawl shape to ExtractedBrand
  const colorsFromFirecrawl = Array.isArray(branding.colors)
    ? branding.colors
        .filter((c: any) => c?.hex)
        .map((c: any) => ({
          hex: c.hex.toUpperCase(),
          weight: c.weight ?? 0.1,
          role: (c.role ?? 'unknown') as ExtractedBrand['colors']['palette'][number]['role'],
        }))
    : [];

  return {
    sourceUrl: url,
    name: metadata.title ?? metadata.ogSiteName ?? branding.name,
    logoUrl: branding.logo?.url ?? branding.logo,
    alternativeLogoUrls: branding.alternativeLogos ?? [],
    colors: {
      primary: colorsFromFirecrawl.find((c: any) => c.role === 'primary')?.hex,
      secondary: colorsFromFirecrawl.find((c: any) => c.role === 'secondary')?.hex,
      accent: colorsFromFirecrawl.find((c: any) => c.role === 'accent')?.hex,
      background: colorsFromFirecrawl.find((c: any) => c.role === 'background')?.hex,
      text: colorsFromFirecrawl.find((c: any) => c.role === 'text')?.hex,
      palette: colorsFromFirecrawl,
    },
    fonts: branding.typography
      ? {
          primary: branding.typography.body
            ? { family: branding.typography.body }
            : undefined,
          display: branding.typography.heading
            ? { family: branding.typography.heading }
            : undefined,
          detected: branding.typography.detected,
        }
      : undefined,
    description: metadata.description ?? metadata.ogDescription,
    referenceImageUrls: metadata.ogImage ? [metadata.ogImage] : [],
    confidence: 0.85, // Firecrawl is high quality
    method: 'firecrawl',
    extractedAt: new Date().toISOString(),
  };
}

// ────────────────────────────────────────────────────────────────
// NATIVE SCRAPER (fallback)
// ────────────────────────────────────────────────────────────────

async function extractWithScraper(url: string): Promise<ExtractedBrand> {
  const html = await fetchHtml(url);

  const name = extractName(html);
  const description = extractMetaContent(html, 'description');
  const ogImage = extractMetaContent(html, 'og:image', 'property');
  const themeColor = extractMetaContent(html, 'theme-color');
  const logoUrl = extractLogoUrl(html, url);

  const palette: ExtractedBrand['colors']['palette'] = [];
  if (themeColor && /^#[0-9a-f]{3,8}$/i.test(themeColor)) {
    palette.push({ hex: themeColor.toUpperCase(), weight: 0.3, role: 'primary' });
  }

  return {
    sourceUrl: url,
    name,
    logoUrl: logoUrl ?? undefined,
    description,
    referenceImageUrls: ogImage ? [ogImage] : [],
    colors: {
      primary: themeColor?.toUpperCase(),
      palette,
    },
    confidence: 0.45, // basic scraping is moderate quality
    method: 'scraper',
    extractedAt: new Date().toISOString(),
    warnings: ['Used basic scraper — install FIRECRAWL_API_KEY for better extraction'],
  };
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function validateUrl(url: string): void {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) {
      throw new Error('Only http(s) URLs are supported');
    }
  } catch {
    throw new BrandExtractionError(url, 'Invalid URL');
  }
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OperatorAI-BrandExtractor/1.0)',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (err) {
    clearTimeout(timeout);
    throw new BrandExtractionError(url, `Fetch failed: ${(err as Error).message}`);
  }
}

function extractName(html: string): string | undefined {
  // og:site_name first
  const og = extractMetaContent(html, 'og:site_name', 'property');
  if (og) return og;

  // application-name
  const appName = extractMetaContent(html, 'application-name');
  if (appName) return appName;

  // <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].split(/[—|·\-]/)[0].trim();
  }

  return undefined;
}

function extractMetaContent(html: string, name: string, attr: 'name' | 'property' = 'name'): string | undefined {
  const re = new RegExp(
    `<meta\\s+(?:[^>]*?\\s)?${attr}=["']${name}["'][^>]*?content=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(re);
  if (match) return match[1].trim();

  // Try reverse order (content before name/property)
  const re2 = new RegExp(
    `<meta\\s+(?:[^>]*?\\s)?content=["']([^"']*)["'][^>]*?${attr}=["']${name}["']`,
    'i'
  );
  const match2 = html.match(re2);
  return match2 ? match2[1].trim() : undefined;
}

function extractLogoUrl(html: string, baseUrl: string): string | null {
  // Strategy 1: <link rel="icon"> with highest priority sizes
  const linkMatches = Array.from(
    html.matchAll(/<link[^>]+rel=["']([^"']*icon[^"']*)["'][^>]*>/gi)
  );

  let bestLogo: string | null = null;
  let bestSize = 0;

  for (const match of linkMatches) {
    const tag = match[0];
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const sizesMatch = tag.match(/sizes=["']([^"']+)["']/i);
    let size = 0;
    if (sizesMatch) {
      const sm = sizesMatch[1].match(/(\d+)/);
      if (sm) size = parseInt(sm[1], 10);
    }

    // Prefer apple-touch-icon (usually higher res)
    if (/apple-touch-icon/i.test(tag)) size += 100;

    if (size > bestSize) {
      bestSize = size;
      bestLogo = resolveUrl(hrefMatch[1], baseUrl);
    }
  }

  if (bestLogo) return bestLogo;

  // Strategy 2: og:image
  const og = extractMetaContent(html, 'og:image', 'property');
  if (og) return resolveUrl(og, baseUrl);

  // Strategy 3: <img> with class containing "logo"
  const imgLogoMatch = html.match(
    /<img[^>]+class=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i
  );
  if (imgLogoMatch) return resolveUrl(imgLogoMatch[1], baseUrl);

  return null;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}
