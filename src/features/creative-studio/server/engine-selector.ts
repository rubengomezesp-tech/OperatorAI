import 'server-only';
import type { Variant, ProductCategory, RenderEngine } from '../types';

/**
 * ENGINE SELECTOR
 *
 * Decides which render engine to use for a given variant.
 *
 * Decision order:
 *   1. Feature gates (env var + API key) — if not set, always Flux
 *   2. Category preference — some categories benefit from gpt-image
 *   3. Default — Flux (cheaper, faster, broader aesthetic range)
 *
 * GPT-Image is NEVER the hard choice without Flux fallback.
 * The render-router wraps this with try/catch → Flux if GPT-Image fails.
 */

export function selectEngine(
  variant: Variant,
  category?: ProductCategory,
): RenderEngine {
  // Gate 1: env requirements
  if (!isGptImageAvailable()) {
    return 'flux';
  }

  // Gate 2: category preference
  const effectiveCategory = category ?? variant.productCategory;
  if (effectiveCategory && GPT_IMAGE_PREFERRED.has(effectiveCategory)) {
    return 'gpt-image';
  }

  // Gate 3: default
  return 'flux';
}

/**
 * Exposed so callers can check availability without triggering a render.
 */
export function isGptImageAvailable(): boolean {
  const enabled = process.env.GPT_IMAGE_ENABLED === 'true';
  const hasKey = !!process.env.OPENAI_API_KEY;
  return enabled && hasKey;
}

/**
 * Debug helper — returns why a particular engine was chosen.
 * Useful for logs when testing.
 */
export function explainEngineChoice(
  variant: Variant,
  category?: ProductCategory,
): { engine: RenderEngine; reason: string } {
  if (!process.env.GPT_IMAGE_ENABLED) {
    return { engine: 'flux', reason: 'GPT_IMAGE_ENABLED not set' };
  }
  if (!process.env.OPENAI_API_KEY) {
    return { engine: 'flux', reason: 'OPENAI_API_KEY missing' };
  }

  const effectiveCategory = category ?? variant.productCategory;
  if (!effectiveCategory) {
    return { engine: 'flux', reason: 'no category detected' };
  }

  if (GPT_IMAGE_PREFERRED.has(effectiveCategory)) {
    return {
      engine: 'gpt-image',
      reason: `${effectiveCategory} benefits from gpt-image precision`,
    };
  }

  if (FLUX_PREFERRED.has(effectiveCategory)) {
    return {
      engine: 'flux',
      reason: `${effectiveCategory} benefits from flux atmosphere`,
    };
  }

  return {
    engine: 'flux',
    reason: `${effectiveCategory} is neutral, flux default`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORY → ENGINE MAPPING
//
// GPT_IMAGE_PREFERRED: categories where gpt-image-1 outperforms Flux.
// These involve precision, product clarity, UI, or clean studio shots.
//
// FLUX_PREFERRED: categories where Flux's atmospheric + photographic
// training outperforms gpt-image. Lifestyle, fashion, cinematic, etc.
//
// Anything not in either set → Flux (cheaper default).
// ═══════════════════════════════════════════════════════════════════

const GPT_IMAGE_PREFERRED: Set<ProductCategory> = new Set([
  'saas_productivity',
  'saas_developer',
  'consumer_tech',
  'digital_product',
]);

const FLUX_PREFERRED: Set<ProductCategory> = new Set([
  'fashion_apparel',
  'streetwear',
  'lifestyle_product',
  'luxury_goods',
  'automotive',
  'food_beverage',
  'beauty_cosmetics',
  'entertainment_media',
]);
