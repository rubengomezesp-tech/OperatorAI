/**
 * ════════════════════════════════════════════════════════════════
 * Operator AI — Premium Composer
 * Phase 1 / File 3 of 4 — Brand defaults & test fixtures
 * ════════════════════════════════════════════════════════════════
 *
 * Provides:
 * 1. DEFAULT_BRAND_KIT — safe fallback when brand_profile is empty
 * 2. OPERATOR_BRAND_KIT — Operator AI's own brand for self-tests
 * 3. createTestBrandKit() — generates a brand kit for QA scenarios
 *
 * CTO note:
 * - This file is INTENTIONALLY independent of brand_profile DB.
 * - Phase 1 (this) tests Composer logic with fake data.
 * - Phase 3 (Brand OS) will add a `brand-adapter.ts` that converts
 *   brand_profile rows → BrandKit using these as fallbacks.
 */

import type { BrandKit } from './types';

// ────────────────────────────────────────────────────────────────
// DEFAULT — used when no BrandKit is provided at all
// ────────────────────────────────────────────────────────────────

/**
 * Universal safe defaults. Renders something legible in any context.
 * Uses Inter (web font, free, available everywhere).
 */
export const DEFAULT_BRAND_KIT: BrandKit = {
  name: 'Default',
  logoUrl: null,
  colors: {
    primary: '#1a1a1a',
    secondary: '#444444',
    accent: '#0066ff',
    onDark: '#ffffff',
    onLight: '#1a1a1a',
    background: '#ffffff',
  },
  fonts: {
    primary: {
      family: 'Inter',
      fallback: 'system-ui, -apple-system, sans-serif',
      weight: 400,
    },
    display: {
      family: 'Inter',
      fallback: 'system-ui, -apple-system, sans-serif',
      weight: 700,
    },
  },
};

// ────────────────────────────────────────────────────────────────
// OPERATOR — your own brand kit
// ────────────────────────────────────────────────────────────────

/**
 * Operator AI's own brand kit.
 * Use this for self-promotional content and dev testing.
 *
 * Colors match the gold gradient seen in your landing page.
 */
export const OPERATOR_BRAND_KIT: BrandKit = {
  name: 'Operator AI',
  logoUrl: 'https://www.operatoraiapp.com/logo.png',
  colors: {
    primary: '#c9a863', // gold
    secondary: '#8a6e2e', // deep gold
    accent: '#f0d591', // light gold
    onDark: '#ededed',
    onLight: '#0a0a0a',
    background: '#0a0a0a',
  },
  fonts: {
    primary: {
      family: 'Inter',
      fallback: 'system-ui, -apple-system, sans-serif',
      weight: 400,
    },
    display: {
      family: 'Inter',
      fallback: 'system-ui, -apple-system, sans-serif',
      weight: 700,
    },
  },
  toneOfVoice: 'Premium, confident, direct. Speaks to founders who want results without fluff.',
  industry: 'AI marketing automation',
  targetAudience: 'Solopreneurs, creators, and small agencies',
};

// ────────────────────────────────────────────────────────────────
// TEST FIXTURES
// ────────────────────────────────────────────────────────────────

/**
 * Create a test brand kit with custom overrides.
 * Used in `pnpm composer:test` (added in Phase 1 / File 4).
 *
 * Example:
 *   createTestBrandKit({ name: 'Acme', colors: { primary: '#ff0000' } })
 */
export function createTestBrandKit(overrides: Partial<BrandKit> = {}): BrandKit {
  return {
    ...DEFAULT_BRAND_KIT,
    ...overrides,
    colors: {
      ...DEFAULT_BRAND_KIT.colors,
      ...overrides.colors,
    },
    fonts: {
      ...DEFAULT_BRAND_KIT.fonts,
      ...overrides.fonts,
      primary: {
        ...DEFAULT_BRAND_KIT.fonts!.primary,
        ...overrides.fonts?.primary,
      },
      display: {
        ...(DEFAULT_BRAND_KIT.fonts!.display ?? DEFAULT_BRAND_KIT.fonts!.primary),
        ...overrides.fonts?.display,
      },
    },
  };
}

// ────────────────────────────────────────────────────────────────
// PREDEFINED TEST KITS — for visual diffing during QA
// ────────────────────────────────────────────────────────────────

/** Saturated red brand — to test high-contrast scenarios */
export const TEST_BRAND_RED: BrandKit = createTestBrandKit({
  name: 'Test Red',
  colors: {
    primary: '#dc2626',
    secondary: '#7f1d1d',
    accent: '#fca5a5',
    onDark: '#ffffff',
    onLight: '#1a1a1a',
  },
});

/** Cool blue brand — to test corporate aesthetic */
export const TEST_BRAND_BLUE: BrandKit = createTestBrandKit({
  name: 'Test Blue',
  colors: {
    primary: '#2563eb',
    secondary: '#1e3a8a',
    accent: '#93c5fd',
    onDark: '#ffffff',
    onLight: '#1a1a1a',
  },
});

/** Warm green brand — to test wellness/nature aesthetic */
export const TEST_BRAND_GREEN: BrandKit = createTestBrandKit({
  name: 'Test Green',
  colors: {
    primary: '#16a34a',
    secondary: '#14532d',
    accent: '#86efac',
    onDark: '#ffffff',
    onLight: '#1a1a1a',
  },
});

/**
 * Get all predefined test kits as an array.
 * Useful for QA scripts that want to render the same plan
 * across multiple brand looks.
 */
export function getAllTestBrandKits(): BrandKit[] {
  return [OPERATOR_BRAND_KIT, TEST_BRAND_RED, TEST_BRAND_BLUE, TEST_BRAND_GREEN];
}
