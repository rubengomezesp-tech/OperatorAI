import 'server-only';
import type {
  Variant,
  ProductBrief,
  ImageAnalysis,
  CampaignDirection,
  RenderEngine,
} from '../types';
import { renderFlux } from './renderers/flux-renderer';
import { renderGptImage } from './renderers/gpt-image-renderer';
import { selectEngine, explainEngineChoice } from './engine-selector';
import { tryComposerV2 } from '@/lib/composer/pipeline';
import { variantToCreativePlan, variantHasComposableContent } from './composer-bridge';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// ═══════════════════════════════════════════════════════════════════
// RENDER ROUTER
//
// Pipeline:
//   1. Select engine (Flux / GPT-Image) via selectEngine()
//   2. Render background image
//   3. (Optional, if composer V2 enabled) Apply Sharp+SVG overlay
//      with brand-aware text, CTA, logo
//
// Composer V2 is OFF by default — controlled by env vars:
//   COMPOSER_V2_ENABLED=true    → on for everyone
//   COMPOSER_V2_TIERS=pro       → on for specific tiers
//   COMPOSER_V2_ORGS=org_abc    → on for specific orgs
// ═══════════════════════════════════════════════════════════════════

export interface RenderInput {
  variant: Variant;
  imageUrls?: string[];
  analyses?: ImageAnalysis[];
  brief?: ProductBrief;
  direction?: CampaignDirection;
  /** Org ID — used by composer V2 to fetch brand kit */
  orgId?: string;
  /** User tier — used by composer V2 for feature flag routing */
  tier?: string;
}

export interface RenderOutput {
  imageUrl: string;
  engine: RenderEngine;
  /** True if primary engine failed and we fell back */
  retried?: boolean;
  /** Which engine originally failed, if any */
  fallbackFrom?: RenderEngine;
  /** True if Composer V2 was applied successfully (Sharp+SVG overlay) */
  composedV2?: boolean;
  /** Background URL before composition (only set if composedV2=true) */
  backgroundUrl?: string;
  /** Optional buffer if composer ran (callers may upload it themselves) */
  composedBuffer?: Buffer;
}

export async function renderVariant(
  input: RenderInput,
): Promise<RenderOutput> {
  // ── STEP 1: Render background ──────────────────────────────────
  const bgResult = await renderBackground(input);

  // ── STEP 2: Optionally apply Composer V2 ───────────────────────
  // Only attempt composition if:
  //   - We have org context (needed for brand kit)
  //   - Variant has composable content (headline / CTA / logo)
  if (input.orgId && variantHasComposableContent(input.variant)) {
    try {
      const composedResult = await applyComposerV2(input, bgResult.imageUrl);
      if (composedResult) {
        return {
          ...bgResult,
          composedBuffer: composedResult.buffer,
          backgroundUrl: bgResult.imageUrl,
          composedV2: true,
        };
      }
    } catch (err) {
      // Graceful degradation — log and return original bg
      console.warn('[render-router] composer V2 failed, returning bg-only', {
        variantId: input.variant.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── STEP 3: Return whatever we got ─────────────────────────────
  return bgResult;
}

// ────────────────────────────────────────────────────────────────
// BACKGROUND RENDER (extracted from old renderVariant body)
// ────────────────────────────────────────────────────────────────

async function renderBackground(input: RenderInput): Promise<RenderOutput> {
  const primary = selectEngine(input.variant, input.variant.productCategory);

  if (process.env.NODE_ENV !== 'production') {
    const explanation = explainEngineChoice(
      input.variant,
      input.variant.productCategory,
    );
    console.log('[render-router]', {
      variantId: input.variant.id,
      category: input.variant.productCategory,
      engine: explanation.engine,
      reason: explanation.reason,
    });
  }

  if (primary === 'gpt-image') {
    try {
      return await renderGptImage(input);
    } catch (err) {
      console.warn('[render-router] gpt-image failed, falling back to flux', {
        variantId: input.variant.id,
        error: err instanceof Error ? err.message : String(err),
      });

      try {
        const fluxResult = await renderFlux(input);
        return {
          ...fluxResult,
          retried: true,
          fallbackFrom: 'gpt-image',
        };
      } catch (fluxErr) {
        console.error('[render-router] flux fallback also failed', {
          variantId: input.variant.id,
          originalError: err instanceof Error ? err.message : String(err),
          fallbackError:
            fluxErr instanceof Error ? fluxErr.message : String(fluxErr),
        });
        throw fluxErr;
      }
    }
  }

  return renderFlux(input);
}

// ────────────────────────────────────────────────────────────────
// COMPOSER V2 STEP
// ────────────────────────────────────────────────────────────────

/**
 * Apply Sharp+SVG composition on top of the rendered background.
 *
 * Returns null if:
 *   - Feature flag is disabled
 *   - Variant has no composable content
 *   - Composer V2 raised any error (graceful fallback)
 */
async function applyComposerV2(
  input: RenderInput,
  bgImageUrl: string,
): Promise<{ buffer: Buffer } | null> {
  if (!input.orgId) return null;

  // Build the plan from variant data
  const plan = variantToCreativePlan(input.variant);

  // Service client for brand kit fetching
  const supabase = createSupabaseServiceClient();

  // Build flag context
  const flagContext = {
    orgId: input.orgId,
    tier: input.tier,
  };

  // Run composer pipeline. tryComposerV2 returns null if flag is off
  // or if composer raises ComposerDisabledError (expected case).
  const result = await tryComposerV2({
    flag: flagContext,
    orgId: input.orgId,
    prompt: input.variant.renderPrompt ?? input.variant.intent ?? '',
    plan,
    supabase,
    // The pipeline expects a renderBackground function — we already have
    // the URL, so we provide a function that just returns it.
    renderBackground: async () => ({ imageUrl: bgImageUrl }),
  });

  if (!result || !result.imageBuffer) {
    return null;
  }

  return { buffer: result.imageBuffer };
}
