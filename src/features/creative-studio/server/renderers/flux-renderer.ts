import 'server-only';
import { generateWithFlux } from '@/features/image-studio/server/flux-client';
import type { Variant, VisualStyle, CampaignDirection } from '../../types';
import type { RenderInput, RenderOutput } from '../render-router';
import {
  VISUAL_STYLES,
  pickDefaultStyleForLayout,
} from '../../data/visual-styles';

/**
 * FLUX RENDERER v8
 *
 * Objetivo:
 * - dejar de sacar frames negros/vacíos
 * - forzar composición usable para anuncios
 * - mantener estética premium real
 * - reservar espacio para copy sin pedir un frame muerto
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

  console.log('[renderFlux] imageUrl:', imageUrl.slice(0, 120));

  return { imageUrl, engine: 'flux' };
}

function buildFluxPrompt(
  variant: Variant,
  styleSpec: (typeof VISUAL_STYLES)[VisualStyle],
  direction?: CampaignDirection,
): string {
  const parts: string[] = [];

  const safeCompositionHint =
    variant.compositionHint ||
    'Subject placed off-center, strong negative space on one side for headline overlay';

  parts.push(
    'premium commercial advertising scene with clearly visible subject matter, visible materials, visible surfaces, visible light detail, layered environment, realistic depth, readable scene structure',
  );

  if (variant.visualDirection) parts.push(variant.visualDirection);
  if (variant.intent) parts.push(variant.intent);

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

  parts.push(...styleSpec.promptHints);

  parts.push('composition: ' + safeCompositionHint);

  parts.push(
    'clear negative space for text overlay, top or side reserved, subject NOT centered, asymmetric composition, advertising layout ready',
  );

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

  parts.push(
    'the frame must not be empty, must not be a plain black background, must contain visible premium scene elements, realistic light falloff, material detail, and clear foreground-midground-background separation',
  );

  parts.push(
    'leave controlled space for later text overlay while preserving a rich visible scene with subject and environment',
  );

  parts.push(
    'no text, no letters, no words, no typography, no UI, no screenshots, text-free composition',
  );

  parts.push(
    'premium commercial photography, editorial polish, high-end brand campaign image, visually readable',
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
    'plain black background',
    'empty frame',
    'dead center subject with no negative space',
  ];

  return [...base, ...styleSpec.negativeHints].join(', ');
}
