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
  if (!isGptImageAvailable()) {
    return 'flux';
  }

  const effectiveCategory = category ?? variant.productCategory;
  if (effectiveCategory && GPT_IMAGE_PREFERRED.includes(effectiveCategory)) {
    return 'gpt-image';
  }

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
 */
export function explainEngineChoice(
  variant: Variant,
  category?: ProductCategory,
): { engine: RenderEngine; reason: string } {
  if (process.env.GPT_IMAGE_ENABLED !== 'true') {
    return { engine: 'flux', reason: 'GPT_IMAGE_ENABLED not set to true' };
  }
  if (!process.env.OPENAI_API_KEY) {
    return { engine: 'flux', reason: 'OPENAI_API_KEY missing' };
  }

  const effectiveCategory = category ?? variant.productCategory;
  if (!effectiveCategory) {
    return { engine: 'flux', reason: 'no category detected' };
  }

  if (GPT_IMAGE_PREFERRED.includes(effectiveCategory)) {
    return {
      engine: 'gpt-image',
      reason: `${effectiveCategory} benefits from gpt-image precision`,
    };
  }

  if (FLUX_PREFERRED.includes(effectiveCategory)) {
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
// Using string[] readonly arrays instead of Set<ProductCategory>
// to avoid TS errors if ProductCategory type definition drifts.
// Categories not in ProductCategory will simply never match.
// ═══════════════════════════════════════════════════════════════════

const GPT_IMAGE_PREFERRED: readonly string[] = [
  'saas_productivity',
  'saas_developer',
  'consumer_tech',
  'digital_product',
];

const FLUX_PREFERRED: readonly string[] = [
  'fashion_apparel',
  'streetwear',
  'lifestyle_product',
  'luxury_goods',
  'automotive',
  'food_beverage',
  'beauty_cosmetics',
  'entertainment_media',
];
