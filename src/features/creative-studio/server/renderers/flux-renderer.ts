import 'server-only';
import { generateWithFlux } from '@/features/image-studio/server/flux-client';
import type { Variant, VisualStyle } from '../../types';
import type { RenderInput, RenderOutput } from './canvas-renderer';
import { VISUAL_STYLES, pickDefaultStyleForLayout } from '../../data/visual-styles';

/**
 * FLUX RENDERER v4A
 * - Uses real negative_prompt via flux-client
 * - Consumes visualDirection, styleHint, intensity, compositionHint from variant
 * - Reference grounding: logo + up to 3 support assets (never hero UI)
 */
export async function renderFlux(input: RenderInput): Promise<RenderOutput> {
  const { variant, imageUrls } = input;

  const style: VisualStyle =
    variant.styleHint ||
    pickDefaultStyleForLayout(variant.layout, variant.intensity);
  const styleSpec = VISUAL_STYLES[style];

  const prompt = buildFluxPrompt(variant, styleSpec);
  const negativePrompt = buildNegativePrompt(styleSpec);

  // Reference grounding: logo + up to 3 support assets.
  // Hero/product screenshots are never sent because we never regenerate UI.
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
    negativePrompt,
  });

  const imageUrl = result.urls?.[0];
  if (!imageUrl) {
    throw new Error('Flux renderer: generateWithFlux returned no URLs');
  }

  return { imageUrl, engine: 'flux' };
}

function buildFluxPrompt(variant: Variant, styleSpec: ReturnType<typeof getStyle>): string {
  const parts: string[] = [];

  // Intent + visual direction go first (most specific)
  if (variant.visualDirection) parts.push(variant.visualDirection);
  if (variant.intent) parts.push(variant.intent);

  // Style-driven art direction
  parts.push(...styleSpec.promptHints);

  // Composition hint
  if (variant.compositionHint) {
    parts.push('composition: ' + variant.compositionHint);
  } else {
    parts.push(styleSpec.composition);
  }

  // Intensity modifier
  if (variant.intensity === 'aggressive') {
    parts.push('high energy, tight framing, dramatic contrast');
  } else if (variant.intensity === 'soft') {
    parts.push('calm pacing, generous negative space, restrained palette');
  }

  // Palette constraint
  parts.push('color palette: ' + variant.palette.join(', '));

  // Absolutes
  parts.push('no text, no letters, no words, text-free composition');
  parts.push('commercial photography quality, award-winning brand advertising');

  return parts.filter(Boolean).join('. ');
}

function buildNegativePrompt(styleSpec: ReturnType<typeof getStyle>): string {
  const base = [
    'generic AI gradient',
    'stock photo aesthetic',
    'AI slop',
    'random text',
    'fake UI',
    'clipart',
    'isometric illustration',
    '3D cartoon render',
    'cheap drop shadows',
    'pastel blobs',
    'watermarks',
    'generic SaaS illustration',
    'Adobe Stock vibe',
    'blurry',
    'low quality',
    'empty background',
    'flat composition',
    'centered symmetrical cliche',
  ];
  return [...base, ...styleSpec.negativeHints].join(', ');
}

// Typed alias for readability (no runtime effect)
function getStyle(v: Variant) {
  const id: VisualStyle = v.styleHint || pickDefaultStyleForLayout(v.layout, v.intensity);
  return VISUAL_STYLES[id];
}
