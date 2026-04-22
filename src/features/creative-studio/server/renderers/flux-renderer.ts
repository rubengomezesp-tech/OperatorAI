import 'server-only';
import { generateWithFlux } from '@/features/image-studio/server/flux-client';
import type { Variant } from '../../types';
import type { RenderInput, RenderOutput } from './canvas-renderer';

const NEGATIVE = [
  'generic AI gradient, stock photo aesthetic, AI slop, random text,',
  'fake UI, pastel blobs, clipart, isometric illustration, 3D render cartoon,',
  'cheap drop shadows, abusive glow, bokeh overkill, watermarks,',
  'generic SaaS illustration, character mascots, Adobe Stock vibe,',
  'blurry, low quality, low-end ad aesthetics',
].join(' ');

interface FluxRenderOptions {
  extraNegative?: string;
  promptSuffix?: string;
}

/**
 * FLUX RENDERER
 * Reuses the existing flux-client.generateWithFlux (same path as /api/images/generate).
 * Passes referenceImageUrls for style grounding (logo + supports) so output
 * stays anchored to the user's visual world, not the training average.
 *
 * This does NOT create a separate Flux integration. It calls the same wrapper
 * the rest of the app uses.
 */
export async function renderFlux(
  input: RenderInput,
  options: FluxRenderOptions = {},
): Promise<RenderOutput> {
  const { variant, imageUrls } = input;

  const prompt = buildFluxPrompt(variant, options.promptSuffix);

  // Reference grounding: pass logo + up to 3 support assets
  // Hero/product screenshots are NOT sent to flux because we never regenerate UI.
  const refUrls: string[] = [];
  if (variant.composition.logoIndex) {
    const u = imageUrls[variant.composition.logoIndex - 1];
    if (u) refUrls.push(u);
  }
  for (const idx of variant.composition.supportAssetIndices || []) {
    const u = imageUrls[idx - 1];
    if (u && refUrls.length < 4) refUrls.push(u);
  }

  const negativePrompt = options.extraNegative
    ? NEGATIVE + ' ' + options.extraNegative
    : NEGATIVE;

  const result = await generateWithFlux({
    prompt,
    aspectRatio: variant.aspectRatio,
    imageModel: 'flux-2-pro',
    referenceImageUrls: refUrls,
    negativePrompt,
  } as any);

  // generateWithFlux returns a url or an object with url
  let imageUrl = '';
  if (typeof result === 'string') {
    imageUrl = result;
  } else if (result && typeof result === 'object') {
    const r = result as any;
    if (r.url) imageUrl = String(r.url);
    else if (r.imageUrl) imageUrl = String(r.imageUrl);
    else if (Array.isArray(r.display_urls) && r.display_urls[0]) {
      imageUrl = String(r.display_urls[0]);
    } else if (Array.isArray(r.images) && r.images[0]) {
      imageUrl = String(r.images[0]);
    }
  }

  if (!imageUrl) {
    throw new Error('Flux renderer: could not extract image URL from result');
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
  ];
  if (suffix) parts.push(suffix);
  return parts.filter(Boolean).join('. ');
}
