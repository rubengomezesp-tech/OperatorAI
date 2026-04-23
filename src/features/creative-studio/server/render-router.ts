import { renderFlux } from '@/features/creative-studio/server/renderers/flux-renderer';
import type {
  Variant,
  ImageAnalysis,
  CampaignDirection,
  QualityReport,
} from '@/features/creative-studio/types';

export interface RenderWithQualityInput {
  variant: Variant;
  imageUrls: string[];
  analyses: ImageAnalysis[];
  direction?: CampaignDirection | null;
}

export interface RenderWithQualityOutput {
  imageUrl: string;
  engine: 'flux';
  retried: boolean;
  qualityReport: QualityReport | null;
}

/**
 * 🔧 Router simplificado (sin Supabase, sin errores de tipos)
 * Solo renderiza usando Flux
 */
export async function renderWithQuality(
  input: RenderWithQualityInput,
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
      qualityReport: null, // ⚠️ Quality gate OFF por ahora
    };
  } catch (err: any) {
    console.error('[render-router] error:', err?.message || err);
    throw err;
  }
}
