import 'server-only';
import type { Variant, ProductCategory, RenderEngine } from '../types';

/**
 * ENGINE SELECTOR (Premium-first)
 *
 * Strategy:
 *   - DEFAULT: gpt-image high quality (TIER S — composition, text, prompt-following)
 *   - FALLBACK: flux (only if gpt-image unavailable or fails at runtime)
 *
 * GPT Image 1.5 leads ELO leaderboards in 2026 and produces premium output
 * for marketing/advertising use cases. Flux retained as resilient fallback.
 *
 * The render-router wraps this with try/catch → falls back to Flux
 * automatically if gpt-image fails (rate limit, API error, etc.).
 */

export function selectEngine(
  variant: Variant,
  category?: ProductCategory,
): RenderEngine {
  // If gpt-image is available, ALWAYS use it (premium default)
  if (isGptImageAvailable()) {
    return 'gpt-image';
  }

  // Fallback: Flux (no API key for gpt-image)
  return 'flux';
}

/**
 * Exposed so callers can check availability without triggering a render.
 */
export function isGptImageAvailable(): boolean {
  const enabled = process.env.GPT_IMAGE_ENABLED !== 'false'; // default ON
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
  if (!process.env.OPENAI_API_KEY) {
    return { engine: 'flux', reason: 'OPENAI_API_KEY missing — fallback to Flux' };
  }
  if (process.env.GPT_IMAGE_ENABLED === 'false') {
    return { engine: 'flux', reason: 'GPT_IMAGE_ENABLED explicitly false' };
  }

  return {
    engine: 'gpt-image',
    reason: 'gpt-image is premium default (TIER S quality, ELO #1)',
  };
}
