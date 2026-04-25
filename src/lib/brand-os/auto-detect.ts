/**
 * Operator AI — Brand OS
 * Phase 3 / Auto-Detect Pipeline
 *
 * The end-to-end flow:
 *   URL
 *     ↓
 *   Extract brand DNA (Firecrawl/scraper)
 *     ↓
 *   Download logo image
 *     ↓
 *   Upload logo to Supabase Storage
 *     ↓
 *   Save brand_profile row with all data
 *     ↓
 *   Return BrandProfile ready to use
 *
 * Used by:
 * - Onboarding wizard (user pastes their site URL)
 * - "Add brand" button in Brand OS UI
 * - Bulk import for agency tier
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BrandProfile, ExtractedBrand } from './types';
import { BrandExtractionError } from './types';
import { extractBrandFromUrl } from './url-extractor';
import { uploadLogo } from './logo-uploader';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface AutoDetectInput {
  supabase: SupabaseClient;
  orgId: string;
  url: string;
  /** Whether to persist to brand_profile (default: true) */
  persist?: boolean;
  /** Whether to download the logo (default: true) */
  downloadLogo?: boolean;
}

export interface AutoDetectResult {
  brand: BrandProfile;
  extracted: ExtractedBrand;
  /** True if data was saved to brand_profile */
  persisted: boolean;
  /** True if logo was uploaded to our storage */
  logoUploaded: boolean;
  /** Diagnostic info */
  meta: {
    durationMs: number;
    extractionMethod: ExtractedBrand['method'];
    confidence: number;
    warnings: string[];
  };
}

/**
 * Run the full URL → BrandProfile pipeline.
 */
export async function autoDetectBrand(input: AutoDetectInput): Promise<AutoDetectResult> {
  const start = Date.now();
  const { supabase, orgId, url, persist = true, downloadLogo = true } = input;

  // 1. Extract from URL
  const extracted = await extractBrandFromUrl({ url, extractColorsFromLogo: true });
  const warnings = [...(extracted.warnings ?? [])];

  // 2. Download + upload logo (if available + enabled)
  let logoStoragePath: string | undefined;
  let finalLogoUrl: string | undefined = extracted.logoUrl;
  let logoUploaded = false;

  if (downloadLogo && extracted.logoUrl) {
    try {
      const uploaded = await uploadLogo({
        supabase,
        orgId,
        source: extracted.logoUrl,
        variant: 'main',
        autoResize: true,
      });
      finalLogoUrl = uploaded.publicUrl;
      logoStoragePath = uploaded.storagePath;
      logoUploaded = true;
      warnings.push(...(uploaded.warnings ?? []));
    } catch (err) {
      warnings.push(`Logo upload failed (using external URL): ${(err as Error).message}`);
    }
  }

  // 3. Build BrandProfile
  const brand: BrandProfile = {
    orgId,
    name: extracted.name,
    logoUrl: finalLogoUrl ?? null,
    logoStoragePath,
    colors: {
      primary: extracted.colors.primary ?? '#1A1A1A',
      secondary: extracted.colors.secondary,
      accent: extracted.colors.accent,
      background: extracted.colors.background,
      onDark: '#FFFFFF',
      onLight: '#000000',
    },
    fonts: extracted.fonts
      ? {
          primary: extracted.fonts.primary
            ? { family: extracted.fonts.primary.family, fallback: 'system-ui, sans-serif' }
            : { family: 'Inter', fallback: 'system-ui, sans-serif' },
          display: extracted.fonts.display
            ? { family: extracted.fonts.display.family, fallback: 'system-ui, sans-serif' }
            : undefined,
        }
      : undefined,
    sourceUrl: url,
    referenceImageUrls: extracted.referenceImageUrls,
    extractionMetadata: {
      method: extracted.method,
      extractedAt: extracted.extractedAt,
      confidence: extracted.confidence,
      warnings,
    },
  };

  // 4. Persist
  let persisted = false;
  if (persist) {
    try {
      await persistBrandProfile(supabase, brand);
      persisted = true;
    } catch (err) {
      warnings.push(`Persistence failed: ${(err as Error).message}`);
    }
  }

  return {
    brand,
    extracted,
    persisted,
    logoUploaded,
    meta: {
      durationMs: Date.now() - start,
      extractionMethod: extracted.method,
      confidence: extracted.confidence,
      warnings,
    },
  };
}

// ────────────────────────────────────────────────────────────────
// PERSISTENCE
// ────────────────────────────────────────────────────────────────

async function persistBrandProfile(
  supabase: SupabaseClient,
  brand: BrandProfile
): Promise<void> {
  if (!brand.orgId) {
    throw new Error('Cannot persist brand without orgId');
  }

  // Build payload — only include columns that exist in brand_profile
  const payload: Record<string, unknown> = {
    org_id: brand.orgId,
    name: brand.name,
    logo_url: brand.logoUrl,
    logo_storage_path: brand.logoStoragePath,
    colors: serializeColors(brand.colors),
    fonts: serializeFonts(brand.fonts),
    source_url: brand.sourceUrl,
    reference_image_urls: brand.referenceImageUrls,
    extraction_metadata: brand.extractionMetadata,
  };

  // Remove undefined values
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  const { error } = await supabase
    .from('brand_profile')
    .upsert(payload, { onConflict: 'org_id' });

  if (error) {
    throw new Error(`brand_profile upsert failed: ${error.message}`);
  }
}

function serializeColors(colors: BrandProfile['colors']): Record<string, string> {
  const out: Record<string, string> = {};
  if (colors.primary) out.primary = colors.primary;
  if (colors.secondary) out.secondary = colors.secondary;
  if (colors.accent) out.accent = colors.accent;
  if (colors.onDark) out.onDark = colors.onDark;
  if (colors.onLight) out.onLight = colors.onLight;
  if (colors.background) out.background = colors.background;
  return out;
}

function serializeFonts(fonts: BrandProfile['fonts']): Record<string, unknown> | null {
  if (!fonts) return null;
  return {
    primary: fonts.primary
      ? {
          family: fonts.primary.family,
          fallback: fonts.primary.fallback,
          weight: fonts.primary.weight,
          woff2Url: fonts.primary.woff2Url,
        }
      : undefined,
    display: fonts.display
      ? {
          family: fonts.display.family,
          fallback: fonts.display.fallback,
          weight: fonts.display.weight,
          woff2Url: fonts.display.woff2Url,
        }
      : undefined,
  };
}
