/**
 * Operator AI — Model Router
 * Phase 2 / Decision Tree
 *
 * The brain. Selects the optimal ModelClient given:
 * - Output type (ad / mockup / poster / etc)
 * - User tier (free / pro / agency)
 * - Required capabilities
 * - Cost / latency budgets
 *
 * Decision precedence:
 *   1. Hard requirements (capabilities, budget) filter candidates
 *   2. Tier-specific preferences pick the winner
 *   3. Fallback chain handles vendor outages
 */

import type { ModelClient, OutputType, RoutingContext, Tier } from './types';
import { NoModelAvailableError } from './types';
import { fluxPro, fluxProUltra, fluxSchnell, fluxProKontext, fluxProKontextMax } from './flux';
import { ideogramV3, ideogramV3Turbo } from './ideogram';
import { recraftV3, recraftV3Svg } from './recraft';
import { gptImage15 } from './gpt-image';
import { realEsrgan } from './upscale';

// ────────────────────────────────────────────────────────────────
// REGISTRY — all clients
// ────────────────────────────────────────────────────────────────

export const ALL_CLIENTS: Record<string, ModelClient> = {
  'flux-1.1-pro': fluxPro,
  'flux-1.1-pro-ultra': fluxProUltra,
  'flux-schnell': fluxSchnell,
  'flux-pro-kontext': fluxProKontext,
  'flux-pro-kontext-max': fluxProKontextMax,
  'ideogram-v3': ideogramV3,
  'ideogram-v3-turbo': ideogramV3Turbo,
  'recraft-v3': recraftV3,
  'recraft-v3-svg': recraftV3Svg,
  'gpt-image-1.5': gptImage15,
  'real-esrgan': realEsrgan,
};

// ────────────────────────────────────────────────────────────────
// DECISION MATRIX
// ────────────────────────────────────────────────────────────────

/**
 * Tier preferences — which model wins for each (tier, outputType) combo.
 * Order matters: first item is primary, others are fallbacks.
 */
const PREFERENCE_MATRIX: Record<Tier, Record<OutputType, string[]>> = {
  // ── FREE tier — minimize cost ────────────────────────────────
  free: {
    'background-only': ['flux-schnell'],
    'ad-with-text': ['flux-schnell'], // text added by Composer
    'ad-text-in-image': ['ideogram-v3-turbo'], // when AI must render text
    mockup: ['flux-schnell'],
    poster: ['recraft-v3'],
    photoreal: ['flux-schnell'],
    illustration: ['flux-schnell'],
    'logo-locked': ['flux-pro-kontext'],
    edit: ['flux-pro-kontext'],
    draft: ['flux-schnell'],
  },

  // ── PRO tier — balanced quality & cost ──────────────────────
  pro: {
    'background-only': ['flux-1.1-pro', 'flux-schnell'],
    'ad-with-text': ['flux-1.1-pro', 'flux-schnell'], // text added by Composer
    'ad-text-in-image': ['ideogram-v3-turbo', 'recraft-v3'],
    mockup: ['flux-pro-kontext', 'flux-1.1-pro'],
    poster: ['recraft-v3', 'ideogram-v3'],
    photoreal: ['flux-1.1-pro', 'flux-1.1-pro-ultra'],
    illustration: ['recraft-v3', 'flux-1.1-pro'],
    'logo-locked': ['flux-pro-kontext', 'gpt-image-1.5'],
    edit: ['flux-pro-kontext'],
    draft: ['flux-schnell'],
  },

  // ── AGENCY tier — premium quality first ─────────────────────
  agency: {
    'background-only': ['flux-1.1-pro-ultra', 'flux-1.1-pro'],
    'ad-with-text': ['flux-1.1-pro-ultra', 'flux-1.1-pro'],
    'ad-text-in-image': ['gpt-image-1.5', 'ideogram-v3'],
    mockup: ['flux-pro-kontext-max', 'flux-pro-kontext'],
    poster: ['recraft-v3', 'ideogram-v3'],
    photoreal: ['flux-1.1-pro-ultra', 'gpt-image-1.5'],
    illustration: ['recraft-v3', 'flux-1.1-pro-ultra'],
    'logo-locked': ['gpt-image-1.5', 'flux-pro-kontext-max'],
    edit: ['flux-pro-kontext-max', 'gpt-image-1.5'],
    draft: ['flux-schnell'],
  },
};

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

/**
 * Select the best model for the given context.
 * Returns the primary client. Use `getFallbackChain` to get backups.
 */
export function selectModel(ctx: RoutingContext): ModelClient {
  const chain = getFallbackChain(ctx);
  if (chain.length === 0) {
    throw new NoModelAvailableError(ctx);
  }
  return chain[0];
}

/**
 * Get the full ordered list of candidate clients (primary + fallbacks).
 * Useful for retry logic that tries each in turn.
 */
export function getFallbackChain(ctx: RoutingContext): ModelClient[] {
  const tierPrefs = PREFERENCE_MATRIX[ctx.tier];
  if (!tierPrefs) {
    throw new NoModelAvailableError(ctx);
  }

  const preferredIds = tierPrefs[ctx.outputType] ?? [];
  const candidates = preferredIds
    .map((id) => ALL_CLIENTS[id])
    .filter(Boolean) as ModelClient[];

  // Apply hard filters
  return candidates.filter((c) => matchesContext(c, ctx));
}

function matchesContext(client: ModelClient, ctx: RoutingContext): boolean {
  // Required capabilities filter
  if (ctx.requiredCapabilities) {
    for (const cap of ctx.requiredCapabilities) {
      if (!client.capabilities.has(cap)) return false;
    }
  }

  // Cost budget filter
  if (ctx.maxCostCents !== undefined && client.costCentsPerImage > ctx.maxCostCents) {
    return false;
  }

  // Latency budget filter
  if (ctx.maxLatencyMs !== undefined && client.typicalLatencyMs > ctx.maxLatencyMs) {
    return false;
  }

  return true;
}

// ────────────────────────────────────────────────────────────────
// EXECUTOR — render with automatic fallback
// ────────────────────────────────────────────────────────────────

import type { RenderRequest, RenderResult } from './types';

/**
 * Render with automatic vendor fallback.
 * If the primary model fails (timeout, vendor down, etc),
 * automatically tries the next in the fallback chain.
 *
 * Logs each attempt for observability.
 */
export async function renderWithFallback(
  ctx: RoutingContext,
  req: RenderRequest
): Promise<RenderResult> {
  const chain = getFallbackChain(ctx);
  if (chain.length === 0) {
    throw new NoModelAvailableError(ctx);
  }

  let lastError: unknown;

  for (const client of chain) {
    try {
      const result = await client.render(req);
      return result;
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.warn(
        `[router] ${client.id} failed (${(err as Error).message}), trying next in chain`
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All models in fallback chain failed');
}

// ────────────────────────────────────────────────────────────────
// DIAGNOSTIC
// ────────────────────────────────────────────────────────────────

export function explainRouting(ctx: RoutingContext): string {
  const chain = getFallbackChain(ctx);
  if (chain.length === 0) {
    return `No models available for ${ctx.outputType} on ${ctx.tier} tier`;
  }
  const primary = chain[0];
  const fallbacks = chain.slice(1).map((c) => c.id).join(', ');
  return [
    `outputType=${ctx.outputType} tier=${ctx.tier}`,
    `→ primary: ${primary.id} (${primary.costCentsPerImage}¢, ~${primary.typicalLatencyMs}ms)`,
    fallbacks ? `→ fallbacks: ${fallbacks}` : '→ no fallbacks',
  ].join(' | ');
}
