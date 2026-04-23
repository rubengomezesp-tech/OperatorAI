import { renderFlux } from '@/features/creative-studio/server/renderers/flux-renderer';
import type {
  Variant,
  ImageAnalysis,
  CampaignDirection,
  QualityReport,
} from '@/features/creative-studio/types';

export interface RenderInput {
  variant: Variant;
  imageUrls: string[];
  analyses: ImageAnalysis[];
  direction?: CampaignDirection | null;
}

export interface RenderOutput {
  imageUrl: string;
  engine: 'flux';
}

export interface RenderWithQualityOutput extends RenderOutput {
  retried: boolean;
  qualityReport: QualityReport | null;
}

/**
 * Router simplificado:
 * - renderiza con Flux
 * - no usa quality gate por ahora
 * - mantiene compatibilidad con flux-renderer.ts
 */
export async function renderWithQuality(
  input: RenderInput,
): Promise<RenderWithQualityOutput> {
  try {
    const result = await renderFlux({
      variant: input.variant,
      imageUrls: input.imageUrls,
      analyses: input.analyses,
      direction: input.direction ?? undefined,
    });

    if (!result?.imageUrl) {
      throw new Error('Flux returned no image');
    }

    return {
      imageUrl: result.imageUrl,
      engine: 'flux',
      retried: false,
      qualityReport: null,
    };
  } catch (err: any) {
    console.error('[render-router] error:', err?.message || err);
    throw err;
  }
}
