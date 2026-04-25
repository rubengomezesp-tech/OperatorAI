/**
 * Operator AI — Model Router
 * Phase 2 / Recraft V3 client
 *
 * Recraft excels at:
 * - Poster / typography-heavy aesthetics
 * - Honoring exact hex codes in prompts
 * - Vector SVG output (logo concepts)
 */

import type { ModelClient, RenderRequest, RenderResult } from './types';
import { CATALOG } from './catalog';
import { falCall } from './fal-client';

// ────────────────────────────────────────────────────────────────
// Recraft V3 — raster output, poster aesthetic
// ────────────────────────────────────────────────────────────────

export const recraftV3: ModelClient = {
  id: 'recraft-v3',
  vendor: 'fal',
  capabilities: new Set(CATALOG['recraft-v3'].capabilities),
  costCentsPerImage: CATALOG['recraft-v3'].costCentsPerImage,
  typicalLatencyMs: CATALOG['recraft-v3'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    // Recraft uses a "style" param controlling aesthetic.
    // We default to "any" but smart prompts in Composer will set it explicitly.
    const style = (req.extras?.style as string) ?? 'realistic_image';

    const result = await falCall({
      modelId: 'recraft-v3',
      endpoint: CATALOG['recraft-v3'].endpoint,
      input: {
        prompt: req.prompt,
        ...(req.negativePrompt && { negative_prompt: req.negativePrompt }),
        image_size: mapImageSize(req.aspect),
        style,
        ...(req.referenceImages && { style_url: req.referenceImages[0] }),
      },
    });

    return {
      imageUrl: result.imageUrl,
      modelId: 'recraft-v3',
      vendor: 'fal',
      width: result.width ?? 2048,
      height: result.height ?? 2048,
      costCents: CATALOG['recraft-v3'].costCentsPerImage,
      durationMs: result.durationMs,
      requestId: result.requestId,
      raw: result.raw,
    };
  },
};

// ────────────────────────────────────────────────────────────────
// Recraft V3 SVG — vector output for logo concepts
// ────────────────────────────────────────────────────────────────

export const recraftV3Svg: ModelClient = {
  id: 'recraft-v3-svg',
  vendor: 'fal',
  capabilities: new Set(CATALOG['recraft-v3-svg'].capabilities),
  costCentsPerImage: CATALOG['recraft-v3-svg'].costCentsPerImage,
  typicalLatencyMs: CATALOG['recraft-v3-svg'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    const style = (req.extras?.style as string) ?? 'vector_illustration';

    const result = await falCall({
      modelId: 'recraft-v3-svg',
      endpoint: CATALOG['recraft-v3-svg'].endpoint,
      input: {
        prompt: req.prompt,
        ...(req.negativePrompt && { negative_prompt: req.negativePrompt }),
        image_size: mapImageSize(req.aspect),
        style,
      },
    });

    return {
      imageUrl: result.imageUrl, // SVG file URL
      modelId: 'recraft-v3-svg',
      vendor: 'fal',
      width: result.width ?? 2048,
      height: result.height ?? 2048,
      costCents: CATALOG['recraft-v3-svg'].costCentsPerImage,
      durationMs: result.durationMs,
      requestId: result.requestId,
      raw: result.raw,
    };
  },
};

function mapImageSize(aspect: RenderRequest['aspect']): string {
  switch (aspect) {
    case '1:1':
      return 'square_hd';
    case '4:5':
      return 'portrait_4_5';
    case '9:16':
      return 'portrait_9_16';
    case '16:9':
      return 'landscape_16_9';
    case '3:4':
      return 'portrait_3_4';
    default:
      return 'square_hd';
  }
}
