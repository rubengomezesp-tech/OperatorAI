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
  imageUrls?: string[];
  analyses?: ImageAnalysis[];
  brief?: ProductBrief;
  direction?: CampaignDirection;
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
  input: RenderInput,
): Promise<RenderOutput> {
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
