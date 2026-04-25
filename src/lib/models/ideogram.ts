/**
 * Operator AI — Model Router
 * Phase 2 / Ideogram V3 client
 *
 * Best-in-class text rendering. Use when text MUST be in the image
 * (rare with Composer, but useful for typography-heavy scenes).
 */

import type { ModelClient, RenderRequest, RenderResult } from './types';
import { CATALOG } from './catalog';
import { falCall } from './fal-client';

// ────────────────────────────────────────────────────────────────
// Ideogram V3 — premium text rendering
// ────────────────────────────────────────────────────────────────

export const ideogramV3: ModelClient = {
  id: 'ideogram-v3',
  vendor: 'fal',
  capabilities: new Set(CATALOG['ideogram-v3'].capabilities),
  costCentsPerImage: CATALOG['ideogram-v3'].costCentsPerImage,
  typicalLatencyMs: CATALOG['ideogram-v3'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    const result = await falCall({
      modelId: 'ideogram-v3',
      endpoint: CATALOG['ideogram-v3'].endpoint,
      input: {
        prompt: req.prompt,
        ...(req.negativePrompt && { negative_prompt: req.negativePrompt }),
        aspect_ratio: mapAspect(req.aspect),
        rendering_speed: 'QUALITY', // BALANCED, TURBO, QUALITY
        style: 'AUTO', // AUTO, GENERAL, REALISTIC, DESIGN, RENDER_3D
        ...(req.seed !== undefined && { seed: req.seed }),
        ...(req.referenceImages && { image_urls: req.referenceImages.slice(0, 3) }),
        num_images: 1,
      },
    });

    return {
      imageUrl: result.imageUrl,
      modelId: 'ideogram-v3',
      vendor: 'fal',
      width: result.width ?? 2048,
      height: result.height ?? 2048,
      costCents: CATALOG['ideogram-v3'].costCentsPerImage,
      durationMs: result.durationMs,
      requestId: result.requestId,
      raw: result.raw,
    };
  },
};

// ────────────────────────────────────────────────────────────────
// Ideogram V3 Turbo — cheap+fast text rendering
// ────────────────────────────────────────────────────────────────

export const ideogramV3Turbo: ModelClient = {
  id: 'ideogram-v3-turbo',
  vendor: 'fal',
  capabilities: new Set(CATALOG['ideogram-v3-turbo'].capabilities),
  costCentsPerImage: CATALOG['ideogram-v3-turbo'].costCentsPerImage,
  typicalLatencyMs: CATALOG['ideogram-v3-turbo'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    const result = await falCall({
      modelId: 'ideogram-v3-turbo',
      endpoint: CATALOG['ideogram-v3-turbo'].endpoint,
      input: {
        prompt: req.prompt,
        ...(req.negativePrompt && { negative_prompt: req.negativePrompt }),
        aspect_ratio: mapAspect(req.aspect),
        rendering_speed: 'TURBO',
        style: 'AUTO',
        ...(req.seed !== undefined && { seed: req.seed }),
        num_images: 1,
      },
    });

    return {
      imageUrl: result.imageUrl,
      modelId: 'ideogram-v3-turbo',
      vendor: 'fal',
      width: result.width ?? 1024,
      height: result.height ?? 1024,
      costCents: CATALOG['ideogram-v3-turbo'].costCentsPerImage,
      durationMs: result.durationMs,
      requestId: result.requestId,
      raw: result.raw,
    };
  },
};

function mapAspect(aspect: RenderRequest['aspect']): string {
  switch (aspect) {
    case '1:1':
      return 'ASPECT_1_1';
    case '4:5':
      return 'ASPECT_4_5';
    case '9:16':
      return 'ASPECT_9_16';
    case '16:9':
      return 'ASPECT_16_9';
    case '1.91:1':
      return 'ASPECT_2_1';
    case '3:4':
      return 'ASPECT_3_4';
    default:
      return 'ASPECT_1_1';
  }
}
