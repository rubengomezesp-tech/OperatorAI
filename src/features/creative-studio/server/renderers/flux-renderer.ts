import 'server-only';
import { generateWithFlux } from '@/features/image-studio/server/flux-client';
import type { Variant, VisualStyle, CampaignDirection } from '../../types';
import type { RenderInput, RenderOutput } from '../render-router';
import { VISUAL_STYLES, pickDefaultStyleForLayout } from '../../data/visual-styles';

/**
 * FLUX RENDERER v6
 *
 * Produces the final visual background for every variant.
 * Canvas-renderer and hybrid-renderer are retired.
 *
 * Critical output rule:
 *   The generated image MUST be text-free. All headline/subheadline/CTA copy
 *   is overlaid by the editor at export time. This is why we hardcode
 *   "no text, no letters, no words" into the prompt and the negative prompt.
 *
 * Inputs that actually drive the pixels (in order of weight):
 *   1. variant.visualDirection   — per-variant scene description
 *   2. direction.lightingDirection + motionEnergy + archetype (if passed)
 *   3. variant.styleHint         — picks a VISUAL_STYLES preset
 *   4. variant.intensity         — soft/medium/aggressive modifiers
 *   5. variant.compositionHint   — layout/framing hint
 *   6. variant.palette           — color discipline
 */
export async function renderFlux(
  input: RenderInput & { direction?: CampaignDirection },
): Promise<RenderOutput> {
  const { variant, imageUrls } = input;

  const style: VisualStyle =
    variant.styleHint ||
    pickDefaultStyleForLayout(variant.layout, variant.intensity);
  const styleSpec = VISUAL_STYLES[style];

  const prompt = buildFluxPrompt(variant, styleSpec, input.direction);
  const negativePrompt = buildNegativePrompt(styleSpec);

  // Reference grounding: logo + up to 3 support assets.
  // Hero/product screenshots are never sent — Flux must not regenerate UI.
  const rawRefUrls: unknown[] = [];

if (variant.composition.logoIndex) {
  rawRefUrls.push(imageUrls[variant.composition.logoIndex - 1]);
}

for (const idx of variant.composition.supportAssetIndices || []) {
  if (rawRefUrls.length < 4) {
    rawRefUrls.push(imageUrls[idx - 1]);
  }
}

const refUrls = rawRefUrls.filter(
  (u): u is string => typeof u === 'string' && u.trim().length > 0
);

  const result = await generateWithFlux({
    prompt,
    aspectRatio: variant.aspectRatio,
    model: 'flux-2-pro',
    negativePrompt,
  });

  const imageUrl = result.urls?.[0];
  if (!imageUrl) {
    throw new Error('Flux renderer: generateWithFlux returned no URLs');
  }
  if (!imageUrl.startsWith('http')) {
    throw new Error('Flux renderer: returned non-http URL');
  }

  return { imageUrl, engine: 'flux' };
}

function buildFluxPrompt(
  variant: Variant,
  styleSpec: (typeof VISUAL_STYLES)[VisualStyle],
  direction?: CampaignDirection,
): string {
  const parts: string[] = [];

  // 1. Per-variant visual direction goes first (most specific)
  if (variant.visualDirection) parts.push(variant.visualDirection);
  if (variant.intent) parts.push(variant.intent);

  // 2. Campaign-level direction (from creative-brain, if present)
  if (direction) {
    const lighting = direction.lightingDirection.replace('_', ' ');
    const motion = direction.motionEnergy;
    const archetype = direction.archetype;

    parts.push('lighting: ' + lighting);
    parts.push('energy: ' + motion + ' composition');
    parts.push('archetype: ' + archetype + ' advertising');

    // Cultural references discipline the output toward real photography
    if (direction.culturalReferences && direction.culturalReferences.length > 0) {
      parts.push(
        'reference aesthetic: ' + direction.culturalReferences.slice(0, 2).join(' and '),
      );
    }
  }

  // 3. Style preset art direction
  parts.push(...styleSpec.promptHints);

  // 4. Composition hint
  if (variant.compositionHint) {
    parts.push('composition: ' + variant.compositionHint);
  } else {
    parts.push(styleSpec.composition);
  }

  // 5. Intensity modifier
  if (variant.intensity === 'aggressive') {
    parts.push('high energy, tight framing, dramatic contrast');
  } else if (variant.intensity === 'soft') {
    parts.push('calm pacing, generous negative space, restrained palette');
  }

  // 6. Palette constraint
  if (direction) {
    parts.push(
      'color palette: dominant ' +
        direction.paletteDirection.dominant +
        ', accent ' +
        direction.paletteDirection.accent,
    );
  } else if (variant.palette.length > 0) {
    parts.push('color palette: ' + variant.palette.join(', '));
  }

  // 7. HARD no-text rule (critical — editor will add text)
  parts.push(
    'no text, no letters, no words, no typography, text-free composition, clean background ready for overlay copy',
  );

  // 8. Quality floor
  parts.push(
    'commercial photography quality, award-winning brand advertising, editorial polish',
  );

  return parts.filter(Boolean).join('. ');
}

function buildNegativePrompt(
  styleSpec: (typeof VISUAL_STYLES)[VisualStyle],
): string {
  const base = [
    'text',
    'letters',
    'words',
    'typography',
    'watermark',
    'signature',
    'captions',
    'UI elements',
    'screenshots',
    'generic AI gradient',
    'stock photo aesthetic',
    'AI slop',
    'clipart',
    'isometric illustration',
    '3D cartoon render',
    'cheap drop shadows',
    'pastel blobs',
    'generic SaaS illustration',
    'Adobe Stock vibe',
    'blurry',
    'low quality',
    'empty background',
    'flat composition',
    'centered symmetrical cliche',
    'dark empty template',
    'plain dark background',
  ];
  return [...base, ...styleSpec.negativeHints].join(', ');
}
