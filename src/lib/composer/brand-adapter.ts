/**
 * Operator AI — Premium Composer
 * Phase 1.4 / Brand Adapter
 *
 * Reads brand_profile from Supabase and returns a normalized BrandKit.
 * Falls back to DEFAULT_BRAND_KIT if no row found or parsing fails.
 *
 * IMPORTANT: This adapter NEVER throws — broken brand data must not
 * block ad generation. Falls back gracefully and logs warnings.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BrandKit, BrandColors, BrandFonts } from './types';
import { DEFAULT_BRAND_KIT, OPERATOR_BRAND_KIT } from './brand-defaults';
import { normalizeHex } from './utils';

/**
 * Fetch a BrandKit for an org_id.
 *
 * @param supabase Supabase client (should be service-role for RLS-bypass)
 * @param orgId The organization ID
 * @returns A BrandKit (always valid, never throws)
 */
export async function getBrandKitForOrg(
  supabase: SupabaseClient,
  orgId: string
): Promise<BrandKit> {
  if (!orgId) {
    return DEFAULT_BRAND_KIT;
  }

  try {
    const { data, error } = await supabase
      .from('brand_profile')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.warn(`[brand-adapter] Query error for org ${orgId}:`, error.message);
      return DEFAULT_BRAND_KIT;
    }

    if (!data) {
      return DEFAULT_BRAND_KIT;
    }

    return mapRowToBrandKit(data, orgId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[brand-adapter] Unexpected error:`, (err as Error).message);
    return DEFAULT_BRAND_KIT;
  }
}

/**
 * Map a brand_profile row to BrandKit.
 * Tolerant of missing/malformed columns.
 */
export function mapRowToBrandKit(row: BrandProfileRow, orgId: string): BrandKit {
  const colors = parseColors(row.colors);
  const fonts = parseFonts(row.fonts);

  return {
    id: row.id ?? orgId,
    orgId,
    name: row.name ?? row.brand_name ?? 'Unnamed',
    logoUrl: row.logo_url ?? null,
    colors,
    fonts,
    toneOfVoice: row.tone_of_voice ?? row.tone ?? undefined,
    industry: row.industry ?? undefined,
    targetAudience: row.target_audience ?? undefined,
  };
}

// ────────────────────────────────────────────────────────────────
// PARSERS — defensive, tolerate any shape
// ────────────────────────────────────────────────────────────────

function parseColors(raw: unknown): BrandColors {
  // Default fallback colors
  const fallback: BrandColors = { ...DEFAULT_BRAND_KIT.colors };

  if (!raw) return fallback;

  // Case 1: jsonb array of strings ["#ff0000", "#00ff00"]
  if (Array.isArray(raw) && raw.length > 0) {
    const hexes = raw
      .filter((x) => typeof x === 'string')
      .map((x) => normalizeHex(x as string, ''))
      .filter(Boolean);

    if (hexes.length > 0) {
      return {
        primary: hexes[0],
        secondary: hexes[1] ?? hexes[0],
        accent: hexes[2] ?? hexes[1] ?? hexes[0],
        onDark: '#FFFFFF',
        onLight: '#000000',
        background: hexes[hexes.length - 1] ?? '#FFFFFF',
      };
    }
  }

  // Case 2: jsonb object { primary: "#...", secondary: "#..." }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const primary = typeof obj.primary === 'string' ? normalizeHex(obj.primary) : fallback.primary;
    return {
      primary,
      secondary: typeof obj.secondary === 'string' ? normalizeHex(obj.secondary) : undefined,
      accent: typeof obj.accent === 'string' ? normalizeHex(obj.accent) : undefined,
      onDark: typeof obj.onDark === 'string' ? normalizeHex(obj.onDark) : '#FFFFFF',
      onLight: typeof obj.onLight === 'string' ? normalizeHex(obj.onLight) : '#000000',
      background: typeof obj.background === 'string' ? normalizeHex(obj.background) : undefined,
    };
  }

  return fallback;
}

function parseFonts(raw: unknown): BrandFonts | undefined {
  if (!raw) return undefined;

  // Case 1: jsonb array of font names ["Inter", "Playfair Display"]
  if (Array.isArray(raw) && raw.length > 0) {
    const names = raw.filter((x) => typeof x === 'string') as string[];
    if (names.length === 0) return undefined;

    return {
      primary: {
        family: names[0],
        fallback: 'system-ui, -apple-system, sans-serif',
        weight: 400,
      },
      display: names[1]
        ? {
            family: names[1],
            fallback: 'system-ui, -apple-system, sans-serif',
            weight: 700,
          }
        : undefined,
    };
  }

  // Case 2: jsonb object { primary: { family, woff2Url }, display: {...} }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;

    const primary = parseFont(obj.primary);
    const display = parseFont(obj.display);

    if (!primary && !display) return undefined;

    return {
      primary: primary ?? {
        family: 'Inter',
        fallback: 'system-ui, -apple-system, sans-serif',
        weight: 400,
      },
      display: display ?? primary ?? undefined,
    };
  }

  return undefined;
}

function parseFont(raw: unknown):
  | { family: string; woff2Url?: string; weight?: number; fallback?: string }
  | undefined {
  if (!raw) return undefined;

  if (typeof raw === 'string') {
    return { family: raw, fallback: 'system-ui, sans-serif', weight: 400 };
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const family = typeof obj.family === 'string' ? obj.family : undefined;
    if (!family) return undefined;

    return {
      family,
      woff2Url: typeof obj.woff2Url === 'string' ? obj.woff2Url : undefined,
      weight: typeof obj.weight === 'number' ? obj.weight : 400,
      fallback: typeof obj.fallback === 'string' ? obj.fallback : 'system-ui, sans-serif',
    };
  }

  return undefined;
}

// ────────────────────────────────────────────────────────────────
// TYPES — DB shape (loose, tolerant)
// ────────────────────────────────────────────────────────────────

export interface BrandProfileRow {
  id?: string;
  org_id?: string;
  name?: string;
  brand_name?: string;
  logo_url?: string | null;
  colors?: unknown;
  fonts?: unknown;
  tone?: string;
  tone_of_voice?: string;
  industry?: string;
  target_audience?: string;
  [key: string]: unknown;
}
