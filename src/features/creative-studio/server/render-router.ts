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
//   3. (Optional) Apply Composer V2 (Sharp+SVG overlay) if flag enabled
// ═══════════════════════════════════════════════════════════════════

export interface RenderInput {
  variant: Variant;
  imageUrls?: string[];
  analyses?: ImageAnalysis[];
  brief?: ProductBrief;
  direction?: CampaignDirection;
  /** Org ID — used by composer V2 to fetch brand kit */
  orgId?: string;
  /** User tier — must be one of 'free' | 'pro' | 'agency' or undefined */
  tier?: string;
}

export interface RenderOutput {
  imageUrl: string;
  engine: RenderEngine;
  retried?: boolean;
  fallbackFrom?: RenderEngine;
  /** True if Composer V2 was applied successfully */
  composedV2?: boolean;
  /** Background URL before composition (only set if composedV2=true) */
  backgroundUrl?: string;
  /** Buffer of composed image (caller can upload) */
  composedBuffer?: Buffer;
}

const VALID_TIERS = ['free', 'pro', 'agency'] as const;
type ValidTier = (typeof VALID_TIERS)[number];

function normalizeTier(input: string | undefined): ValidTier | undefined {
  if (!input) return undefined;
  const lower = input.toLowerCase();
  return VALID_TIERS.includes(lower as ValidTier) ? (lower as ValidTier) : undefined;
}

export async function renderVariant(
  input: RenderInput,
): Promise<RenderOutput> {
  const bgResult = await renderBackground(input);

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
      console.warn('[render-router] composer V2 failed, returning bg-only', {
        variantId: input.variant.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return bgResult;
}

// ────────────────────────────────────────────────────────────────
// BACKGROUND RENDER
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

async function applyComposerV2(
  input: RenderInput,
  bgImageUrl: string,
): Promise<{ buffer: Buffer } | null> {
  if (!input.orgId) return null;

  // Build the plan from variant data — returns null if no composable content
  const plan = variantToCreativePlan(input.variant);
  if (!plan) return null;

  const supabase = createSupabaseServiceClient();

  // Validate tier — ComposerFlagContext requires literal type
  const validTier = normalizeTier(input.tier);

  const flagContext = {
    orgId: input.orgId,
    tier: validTier,
  };

  const result = await tryComposerV2({
    flag: flagContext,
    orgId: input.orgId,
    prompt: input.variant.renderPrompt ?? input.variant.intent ?? '',
    plan,
    supabase,
    renderBackground: async () => ({ imageUrl: bgImageUrl }),
  });

  if (!result || !result.imageBuffer) {
    return null;
  }

  return { buffer: result.imageBuffer };
}
