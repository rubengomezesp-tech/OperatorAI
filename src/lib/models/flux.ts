/**
 * Operator AI — Model Router
 * Phase 2 / Flux clients
 *
 * Wraps fal.ai endpoints for the Flux family.
 */

import type { ModelClient, RenderRequest, RenderResult } from './types';
import { CATALOG } from './catalog';
import { falCall } from './fal-client';

// ────────────────────────────────────────────────────────────────
// Flux 1.1 Pro — workhorse, default for backgrounds
// ────────────────────────────────────────────────────────────────

export const fluxPro: ModelClient = {
  id: 'flux-1.1-pro',
  vendor: 'fal',
  capabilities: new Set(CATALOG['flux-1.1-pro'].capabilities),
  costCentsPerImage: CATALOG['flux-1.1-pro'].costCentsPerImage,
  typicalLatencyMs: CATALOG['flux-1.1-pro'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    const result = await falCall({
      modelId: 'flux-1.1-pro',
      endpoint: CATALOG['flux-1.1-pro'].endpoint,
      input: {
        prompt: req.prompt,
        aspect_ratio: mapAspectRatio(req.aspect),
        num_images: 1,
        enable_safety_checker: true,
        ...(req.seed !== undefined && { seed: req.seed }),
        ...(req.steps !== undefined && { num_inference_steps: req.steps }),
        ...(req.guidance !== undefined && { guidance_scale: req.guidance }),
      },
    });

    return {
      imageUrl: result.imageUrl,
      modelId: 'flux-1.1-pro',
      vendor: 'fal',
      width: result.width ?? req.width ?? 1024,
      height: result.height ?? req.height ?? 1024,
      costCents: CATALOG['flux-1.1-pro'].costCentsPerImage,
      durationMs: result.durationMs,
      requestId: result.requestId,
      raw: result.raw,
    };
  },
};

// ────────────────────────────────────────────────────────────────
// Flux 1.1 Pro Ultra — premium tier hero shots
// ────────────────────────────────────────────────────────────────

export const fluxProUltra: ModelClient = {
  id: 'flux-1.1-pro-ultra',
  vendor: 'fal',
  capabilities: new Set(CATALOG['flux-1.1-pro-ultra'].capabilities),
  costCentsPerImage: CATALOG['flux-1.1-pro-ultra'].costCentsPerImage,
  typicalLatencyMs: CATALOG['flux-1.1-pro-ultra'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    const result = await falCall({
      modelId: 'flux-1.1-pro-ultra',
      endpoint: CATALOG['flux-1.1-pro-ultra'].endpoint,
      input: {
        prompt: req.prompt,
        aspect_ratio: mapAspectRatio(req.aspect),
        num_images: 1,
        enable_safety_checker: true,
        prompt_upsampling: true, // free quality boost
        ...(req.seed !== undefined && { seed: req.seed }),
      },
    });

    return {
      imageUrl: result.imageUrl,
      modelId: 'flux-1.1-pro-ultra',
      vendor: 'fal',
      width: result.width ?? 2048,
      height: result.height ?? 2048,
      costCents: CATALOG['flux-1.1-pro-ultra'].costCentsPerImage,
      durationMs: result.durationMs,
      requestId: result.requestId,
      raw: result.raw,
    };
  },
};

// ────────────────────────────────────────────────────────────────
// Flux Schnell — cheap drafts, free tier
// ────────────────────────────────────────────────────────────────

export const fluxSchnell: ModelClient = {
  id: 'flux-schnell',
  vendor: 'fal',
  capabilities: new Set(CATALOG['flux-schnell'].capabilities),
  costCentsPerImage: CATALOG['flux-schnell'].costCentsPerImage,
  typicalLatencyMs: CATALOG['flux-schnell'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    const result = await falCall({
      modelId: 'flux-schnell',
      endpoint: CATALOG['flux-schnell'].endpoint,
      input: {
        prompt: req.prompt,
        image_size: mapImageSize(req.aspect),
        num_inference_steps: 4, // schnell sweet spot
        num_images: 1,
        ...(req.seed !== undefined && { seed: req.seed }),
      },
    });

    return {
      imageUrl: result.imageUrl,
      modelId: 'flux-schnell',
      vendor: 'fal',
      width: result.width ?? 1024,
      height: result.height ?? 1024,
      costCents: CATALOG['flux-schnell'].costCentsPerImage,
      durationMs: result.durationMs,
      requestId: result.requestId,
      raw: result.raw,
    };
  },
};

// ────────────────────────────────────────────────────────────────
// Flux Pro Kontext — multi-reference editing
// ────────────────────────────────────────────────────────────────

export const fluxProKontext: ModelClient = {
  id: 'flux-pro-kontext',
  vendor: 'fal',
  capabilities: new Set(CATALOG['flux-pro-kontext'].capabilities),
  costCentsPerImage: CATALOG['flux-pro-kontext'].costCentsPerImage,
  typicalLatencyMs: CATALOG['flux-pro-kontext'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    if (!req.referenceImages || req.referenceImages.length === 0) {
      throw new Error('flux-pro-kontext requires at least 1 reference image');
    }

    // Kontext expects a single primary image_url and an array of additional refs
    const primaryRef = req.referenceImages[0];
    const additionalRefs = req.referenceImages.slice(1);

    const result = await falCall({
      modelId: 'flux-pro-kontext',
      endpoint: CATALOG['flux-pro-kontext'].endpoint,
      input: {
        prompt: req.prompt,
        image_url: primaryRef,
        ...(additionalRefs.length > 0 && { additional_image_urls: additionalRefs }),
        aspect_ratio: mapAspectRatio(req.aspect),
        ...(req.seed !== undefined && { seed: req.seed }),
        ...(req.guidance !== undefined && { guidance_scale: req.guidance }),
      },
    });

    return {
      imageUrl: result.imageUrl,
      modelId: 'flux-pro-kontext',
      vendor: 'fal',
      width: result.width ?? 1024,
      height: result.height ?? 1024,
      costCents: CATALOG['flux-pro-kontext'].costCentsPerImage,
      durationMs: result.durationMs,
      requestId: result.requestId,
      raw: result.raw,
    };
  },
};

// ────────────────────────────────────────────────────────────────
// Flux Pro Kontext Max — high fidelity, agency tier
// ────────────────────────────────────────────────────────────────

export const fluxProKontextMax: ModelClient = {
  id: 'flux-pro-kontext-max',
  vendor: 'fal',
  capabilities: new Set(CATALOG['flux-pro-kontext-max'].capabilities),
  costCentsPerImage: CATALOG['flux-pro-kontext-max'].costCentsPerImage,
  typicalLatencyMs: CATALOG['flux-pro-kontext-max'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    if (!req.referenceImages || req.referenceImages.length === 0) {
      throw new Error('flux-pro-kontext-max requires at least 1 reference image');
    }

    const primaryRef = req.referenceImages[0];
    const additionalRefs = req.referenceImages.slice(1);

    const result = await falCall({
      modelId: 'flux-pro-kontext-max',
      endpoint: CATALOG['flux-pro-kontext-max'].endpoint,
      input: {
        prompt: req.prompt,
        image_url: primaryRef,
        ...(additionalRefs.length > 0 && { additional_image_urls: additionalRefs }),
        aspect_ratio: mapAspectRatio(req.aspect),
        ...(req.seed !== undefined && { seed: req.seed }),
      },
    });

    return {
      imageUrl: result.imageUrl,
      modelId: 'flux-pro-kontext-max',
      vendor: 'fal',
      width: result.width ?? 2048,
      height: result.height ?? 2048,
      costCents: CATALOG['flux-pro-kontext-max'].costCentsPerImage,
      durationMs: result.durationMs,
      requestId: result.requestId,
      raw: result.raw,
    };
  },
};

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function mapAspectRatio(aspect: RenderRequest['aspect']): string {
  switch (aspect) {
    case '1:1':
      return '1:1';
    case '4:5':
      return '4:5';
    case '9:16':
      return '9:16';
    case '16:9':
      return '16:9';
    case '1.91:1':
      return '21:9'; // closest fal preset
    case '3:4':
      return '3:4';
    default:
      return '1:1';
  }
}

function mapImageSize(aspect: RenderRequest['aspect']): string {
  // Flux Schnell uses size presets, not aspect ratios
  switch (aspect) {
    case '9:16':
      return 'portrait_16_9';
    case '4:5':
      return 'portrait_4_3';
    case '16:9':
      return 'landscape_16_9';
    case '3:4':
      return 'portrait_4_3';
    case '1:1':
    default:
      return 'square_hd';
  }
}
