/**
 * Operator AI — Model Router
 * Phase 2 / Real-ESRGAN upscale client
 *
 * Used as post-processing step after Composer:
 * - Pro tier: upscale 2× to 2048px
 * - Agency tier: upscale 4× to 4096px
 *
 * Cost: ~$0.001 per upscale on Replicate.
 */

import type { ModelClient, RenderRequest, RenderResult } from './types';
import { CATALOG } from './catalog';
import { replicateCall } from './replicate-client';

// Stable version pinned for production reliability
const REAL_ESRGAN_VERSION =
  'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa';

export const realEsrgan: ModelClient = {
  id: 'real-esrgan',
  vendor: 'replicate',
  capabilities: new Set(CATALOG['real-esrgan'].capabilities),
  costCentsPerImage: CATALOG['real-esrgan'].costCentsPerImage,
  typicalLatencyMs: CATALOG['real-esrgan'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    if (!req.referenceImages || req.referenceImages.length === 0) {
      throw new Error('real-esrgan requires the input image as referenceImages[0]');
    }

    const scale = (req.extras?.scale as number) ?? 2;
    const faceEnhance = (req.extras?.faceEnhance as boolean) ?? true;

    const result = await replicateCall({
      modelId: 'real-esrgan',
      model: 'nightmareai/real-esrgan',
      version: REAL_ESRGAN_VERSION,
      input: {
        image: req.referenceImages[0],
        scale,
        face_enhance: faceEnhance,
      },
    });

    return {
      imageUrl: result.imageUrl,
      modelId: 'real-esrgan',
      vendor: 'replicate',
      width: 0, // Replicate doesn't return final dimensions reliably
      height: 0,
      costCents: CATALOG['real-esrgan'].costCentsPerImage,
      durationMs: result.durationMs,
      raw: result.raw,
    };
  },
};

/**
 * Convenience helper — upscale any image URL to target factor.
 */
export async function upscaleImage(
  imageUrl: string,
  scale: 2 | 4 = 2,
  faceEnhance = true
): Promise<RenderResult> {
  return realEsrgan.render({
    prompt: '', // ignored
    aspect: '1:1', // ignored
    referenceImages: [imageUrl],
    extras: { scale, faceEnhance },
  });
}
