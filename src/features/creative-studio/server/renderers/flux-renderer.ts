import 'server-only';
import { generateWithFlux } from '@/features/image-studio/server/flux-client';
import type { Variant, VisualStyle, CampaignDirection } from '../../types';
import type { RenderInput, RenderOutput } from '../render-router';
import {
  VISUAL_STYLES,
  pickDefaultStyleForLayout,
} from '../../data/visual-styles';

/**
 * FLUX RENDERER v7
 *
 * Objetivo:
 * - dejar de generar frames negros/vacíos
 * - mantener estética premium
 * - forzar sujeto/escena/materiales visibles
 * - seguir siendo text-free para que el editor añada copy después
 */

export async function renderFlux(
  input: RenderInput & { direction?: CampaignDirection },
): Promise<RenderOutput> {
  const { variant } = input;

  const style: VisualStyle =
    variant.styleHint ||
    pickDefaultStyleForLayout(variant.layout, variant.intensity);

  const styleSpec = VISUAL_STYLES[style];

  const prompt = buildFluxPrompt(variant, styleSpec, input.direction);
  const negativePrompt = buildNegativePrompt(styleSpec);

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

  if (
    typeof imageUrl !== 'string' ||
    (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image/'))
  ) {
    throw new Error(
      'Flux renderer: returned invalid image URL: ' + String(imageUrl),
    );
  }

  return { imageUrl, engine: 'flux' };
}

function buildFluxPrompt(
  variant: Variant,
  styleSpec: (typeof VISUAL_STYLES)[VisualStyle],
  direction?: CampaignDirection,
): string {
  const parts: string[] = [];

  // 1. Base visual anchor — fuerza escena visible
  parts.push(
    'premium commercial scene with clearly visible subject matter, visible materials, visible surfaces, visible lighting detail, layered environment, cinematic but readable composition',
  );

  // 2. Variant-level direction
  if (variant.visualDirection) parts.push(variant.visualDirection);
  if (variant.intent) parts.push(variant.intent);

  // 3. Campaign-level direction
  if (direction) {
    const lighting = direction.lightingDirection.replace('_', ' ');
    const motion = direction.motionEnergy;
    const archetype = direction.archetype;

    parts.push('lighting style: ' + lighting);
    parts.push('scene energy: ' + motion);
    parts.push('campaign archetype: ' + archetype + ' advertising');

    if (
      direction.culturalReferences &&
      direction.culturalReferences.length > 0
    ) {
      parts.push(
        'inspired by: ' +
          direction.culturalReferences.slice(0, 2).join(' and '),
      );
    }
  }

  // 4. Style hints
  parts.push(...styleSpec.promptHints);

  // 5. Composition
  if (variant.compositionHint) {
    parts.push('composition: ' + variant.compositionHint);
  } else {
    parts.push('composition: ' + styleSpec.composition);
  }

  // 6. Intensity rebalance
  if (variant.intensity === 'aggressive') {
    parts.push(
      'high visual tension, strong contrast, bold framing, but subject and environment must remain clearly visible',
    );
  } else if (variant.intensity === 'soft') {
    parts.push(
      'calm premium pacing, elegant negative space, restrained palette, but never empty or blank',
    );
  } else {
    parts.push(
      'balanced premium composition, clear focal subject, visible atmospheric depth',
    );
  }

  // 7. Palette
  if (direction) {
    parts.push(
      'brand palette led by dominant ' +
        direction.paletteDirection.dominant +
        ' with accent ' +
        direction.paletteDirection.accent,
    );
  } else if (variant.palette.length > 0) {
    parts.push('palette: ' + variant.palette.join(', '));
  }

  // 8. Fuerza visual para evitar vacío
  parts.push(
    'the frame must not be empty, must not be a plain black background, must contain visible premium scene elements, realistic light falloff, material detail, and clear foreground-midground-background separation',
  );

  // 9. Overlay-safe, pero no muerto
  parts.push(
    'leave controlled negative space for later text overlay, but preserve a rich scene with visible subject and environment',
  );

  // 10. No text
  parts.push(
    'no text, no letters, no words, no typography, no UI, no screenshots, text-free composition',
  );

  // 11. Quality floor
  parts.push(
    'premium commercial photography, editorial polish, visually readable, high-end brand campaign image',
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
    'blurry',
    'low quality',
    'deformed composition',
    'cheap stock photo',
    'clipart',
    'isometric illustration',
    'cartoon render',
    'cheap glow',
    'messy layout',
    'illegible scene',
    'broken perspective',
    'visual noise overload',
  ];

  return [...base, ...styleSpec.negativeHints].join(', ');
}
