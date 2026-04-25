/**
 * Operator AI — Brand OS
 * Phase 3 / Types
 *
 * Extended brand types beyond what's in src/lib/composer/types.ts.
 * These types describe the FULL brand (with extraction metadata,
 * upload state, etc.) — not just what the composer needs to render.
 */

import type { BrandKit } from '@/lib/composer';

// ────────────────────────────────────────────────────────────────
// EXTRACTED BRAND (output of URL → brand pipeline)
// ────────────────────────────────────────────────────────────────

export interface ExtractedBrand {
  /** Source URL the brand was extracted from */
  sourceUrl: string;
  /** Detected brand name (from <title>, og:site_name, h1) */
  name?: string;
  /** Detected logo URL (best candidate) */
  logoUrl?: string;
  /** Alternative logo candidates (dark mode, simplified, etc) */
  alternativeLogoUrls?: string[];
  /** Color palette in hex */
  colors: ExtractedColors;
  /** Typography */
  fonts?: ExtractedFonts;
  /** Tagline / description from meta tags */
  description?: string;
  /** Industry hint */
  industry?: string;
  /** Reference imagery from the page (hero images) */
  referenceImageUrls?: string[];
  /** Extraction quality 0..1 */
  confidence: number;
  /** Method used */
  method: 'firecrawl' | 'scraper' | 'hybrid';
  /** Warnings during extraction */
  warnings?: string[];
  /** When extracted */
  extractedAt: string;
}

export interface ExtractedColors {
  /** Primary brand color */
  primary?: string;
  /** Secondary */
  secondary?: string;
  /** Accent for CTAs */
  accent?: string;
  /** Background dominant */
  background?: string;
  /** Text dominant */
  text?: string;
  /** All detected colors with frequency */
  palette: ExtractedColor[];
}

export interface ExtractedColor {
  hex: string;
  /** Frequency 0..1 (proportion of pixels/elements) */
  weight: number;
  /** Usage hint if detectable */
  role?: 'primary' | 'secondary' | 'accent' | 'background' | 'text' | 'unknown';
}

export interface ExtractedFonts {
  primary?: { family: string; weights?: number[] };
  display?: { family: string; weights?: number[] };
  /** All detected font families */
  detected?: string[];
}

// ────────────────────────────────────────────────────────────────
// UPLOAD RESULTS
// ────────────────────────────────────────────────────────────────

export interface LogoUploadResult {
  /** Public URL (CDN-served) */
  publicUrl: string;
  /** Storage bucket path */
  storagePath: string;
  /** Detected dimensions */
  width: number;
  height: number;
  /** Detected MIME */
  contentType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Whether transparency was detected */
  hasTransparency: boolean;
  /** Validation warnings */
  warnings?: string[];
}

export interface FontUploadResult {
  publicUrl: string;
  storagePath: string;
  /** Detected font family from name table */
  detectedFamily?: string;
  /** Detected weight */
  detectedWeight?: number;
  /** Detected style (regular, italic) */
  detectedStyle?: 'normal' | 'italic';
  /** File size in bytes */
  sizeBytes: number;
  contentType: 'font/woff2' | 'font/woff' | 'font/ttf';
  warnings?: string[];
}

// ────────────────────────────────────────────────────────────────
// FULL BRAND PROFILE (DB-extended)
// ────────────────────────────────────────────────────────────────

/**
 * The complete brand record as stored in DB.
 * Extends the basic BrandKit with persistence + extraction metadata.
 */
export interface BrandProfile extends BrandKit {
  /** Logo stored in our Supabase Storage */
  logoStoragePath?: string;
  /** Optional dark-mode logo */
  logoDarkUrl?: string;
  logoDarkStoragePath?: string;
  /** Font files with storage paths */
  fontFiles?: {
    primary?: { family: string; woff2Url: string; storagePath: string };
    display?: { family: string; woff2Url: string; storagePath: string };
  };
  /** Reference imagery URLs */
  referenceImageUrls?: string[];
  /** Original URL if extracted from website */
  sourceUrl?: string;
  /** Extraction metadata */
  extractionMetadata?: {
    method: 'firecrawl' | 'scraper' | 'manual' | 'hybrid';
    extractedAt: string;
    confidence: number;
    warnings?: string[];
  };
}

// ────────────────────────────────────────────────────────────────
// ERRORS
// ────────────────────────────────────────────────────────────────

export class BrandExtractionError extends Error {
  constructor(public readonly url: string, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'BrandExtractionError';
  }
}

export class BrandUploadError extends Error {
  constructor(public readonly bucket: string, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'BrandUploadError';
  }
}
