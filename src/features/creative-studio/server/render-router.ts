import 'server-only';
import type {
  Variant,
  ProductBrief,
  CampaignDirection,
  RenderEngine,
} from '../types';
import { renderFlux } from './renderers/flux-renderer';
import { renderGptImage } from './renderers/gpt-image-renderer';
import { selectEngine, explainEngineChoice } from './engine-selector';

// ═══════════════════════════════════════════════════════════════════
// RENDER ROUTER
//
// - Selects engine via selectEngine(variant, category)
// - If primary is gpt-image and fails → automatic fallback to Flux
// - Flux does NOT fall back (it's the baseline)
// - Same output contract regardless of engine
// ═══════════════════════════════════════════════════════════════════

export interface RenderInput {
  variant: Variant;
  brief?: ProductBrief;
}

export interface RenderOutput {
  imageUrl: string;
  engine: RenderEngine;
  /** True if primary engine failed and we fell back */
  retried?: boolean;
  /** Which engine originally failed, if any */
  fallbackFrom?: RenderEngine;
}

export async function renderVariant(
  input: RenderInput & { direction?: CampaignDirection },
): Promise<RenderOutput> {
  const primary = selectEngine(input.variant, input.variant.productCategory);

  // Debug logging in non-prod
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

  // Path 1: GPT-Image with Flux fallback
  if (primary === 'gpt-image') {
    try {
      const result = await renderGptImage(input);
      return result;
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
        // Last attempt was Flux, preserve that error
        throw fluxErr;
      }
    }
  }

  // Path 2: Flux (baseline, no fallback)
  return renderFlux(input);
}
