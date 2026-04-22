import 'server-only';
import { generateWithFlux } from '@/features/image-studio/server/flux-client';
import type { Variant } from '../../types';
import type { RenderInput, RenderOutput } from './canvas-renderer';

// Negative-prompt ideas baked into the positive prompt instead, because the
// flux-client does not expose a negativePrompt field. Flux 1.1/2 respect
// natural-language "avoid X, avoid Y" phrasing well.
const AVOID_CLAUSE =
  'avoid generic AI gradients, avoid stock-photo aesthetic, avoid fake UI, ' +
  'avoid clipart, avoid isometric illustration, avoid 3D cartoon render, ' +
  'avoid pastel blobs, avoid abusive glow, avoid watermarks, ' +
  'avoid generic SaaS illustration, avoid Adobe Stock vibe, avoid cheap shadows';

interface FluxRenderOptions {
  promptSuffix?: string;
}

/**
 * FLUX RENDERER
 * Reuses the existing flux-client.generateWithFlux (same path as /api/images/generate).
 * Matches its actual signature: { prompt, aspectRatio, seed?, referenceImageUrls?, model? }
 * Returns { urls: string[], seed, latencyMs }
 */
export async function renderFlux(
  input: RenderInput,
  options: FluxRenderOptions = {},
): Promise<RenderOutput> {
  const { variant, imageUrls } = input;

  const prompt = buildFluxPrompt(variant, options.promptSuffix);

  // Reference grounding: pass logo + up to 3 support assets (max 8 accepted by helper).
  // Hero/product screenshots are NOT sent because we never regenerate UI.
  const refUrls: string[] = [];
  if (variant.composition.logoIndex) {
    const u = imageUrls[variant.composition.logoIndex - 1];
    if (u) refUrls.push(u);
  }
  for (const idx of variant.composition.supportAssetIndices || []) {
    const u = imageUrls[idx - 1];
    if (u && refUrls.length < 4) refUrls.push(u);
  }

  const result = await generateWithFlux({
    prompt,
    aspectRatio: variant.aspectRatio,
    model: 'flux-2-pro',
    referenceImageUrls: refUrls.length > 0 ? refUrls : undefined,
  });

  const imageUrl = result.urls?.[0];
  if (!imageUrl) {
    throw new Error('Flux renderer: generateWithFlux returned no URLs');
  }

  return { imageUrl, engine: 'flux' };
}

function buildFluxPrompt(variant: Variant, suffix?: string): string {
  const parts = [
    variant.renderPrompt || '',
    variant.intent,
    variant.mood,
    'color palette: ' + variant.palette.join(', '),
    'premium advertising composition, cinematic lighting, depth of field',
    'no text, no letters, no words, text-free composition',
    'commercial photography quality, award-winning brand advertising',
    AVOID_CLAUSE,
  ];
  if (suffix) parts.push(suffix);
  return parts.filter(Boolean).join('. ');
}
