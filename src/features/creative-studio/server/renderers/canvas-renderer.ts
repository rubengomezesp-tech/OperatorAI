import 'server-only';
import type { Variant, ImageAnalysis } from '../../types';

export interface RenderInput {
  variant: Variant;
  imageUrls: string[];
  analyses: ImageAnalysis[];
}

export interface RenderOutput {
  imageUrl: string;
  engine: 'canvas' | 'flux' | 'hybrid';
}

/**
 * CANVAS RENDERER
 * Does NOT regenerate UI. Returns a canvas-spec:// URL that the frontend
 * decodes and draws using the real uploaded screenshots.
 *
 * The actual PNG is produced in the browser via the canvas-spec-renderer
 * component (Tanda 3). This keeps real UI pixel-perfect.
 */
export async function renderCanvas(input: RenderInput): Promise<RenderOutput> {
  const { variant, imageUrls } = input;

  const heroUrl = variant.composition.heroAssetIndex
    ? imageUrls[variant.composition.heroAssetIndex - 1]
    : imageUrls[0];

  const spec = {
    type: 'canvas_spec',
    layout: variant.layout,
    aspectRatio: variant.aspectRatio,
    palette: variant.palette,
    mockupType: variant.composition.mockupType || 'none',
    heroUrl,
    supportUrls: (variant.composition.supportAssetIndices || [])
      .map((i) => imageUrls[i - 1])
      .filter((u): u is string => Boolean(u)),
    logoUrl: variant.composition.logoIndex
      ? imageUrls[variant.composition.logoIndex - 1]
      : undefined,
    logoPosition: variant.composition.logoPosition,
    copy: variant.copy,
    backgroundUrl: undefined as string | undefined,
    isHybrid: false,
  };

  const imageUrl = 'canvas-spec://' + encodeURIComponent(JSON.stringify(spec));
  return { imageUrl, engine: 'canvas' };
}
