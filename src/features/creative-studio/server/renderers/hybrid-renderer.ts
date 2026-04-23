import 'server-only';
import { renderFlux } from './flux-renderer';
import { renderCanvas } from './canvas-renderer';
import type { RenderInput, RenderOutput } from './canvas-renderer';
import type { Variant } from '../../types';
import { VISUAL_STYLES, pickDefaultStyleForLayout } from '../../data/visual-styles';

/**
 * HYBRID RENDERER v4A
 * 1. Flux generates an atmospheric background (no product, no UI, no text).
 *    Background prompt is driven by styleHint + visualDirection.
 * 2. Canvas spec overlays real logo, real UI, real copy on top of it.
 *
 * The browser-side canvas-spec-renderer composes the final PNG.
 */
export async function renderHybrid(input: RenderInput): Promise<RenderOutput> {
  const { variant } = input;

  const bgVariant = buildBackgroundVariant(variant);

  let backgroundUrl: string | undefined;
  try {
    const bg = await renderFlux({ ...input, variant: bgVariant });
    backgroundUrl = bg.imageUrl;
  } catch (err) {
    console.error('[hybrid-renderer] flux background failed, falling back to pure canvas:', err);
    return renderCanvas(input);
  }

  const canvasResult = await renderCanvas(input);
  const spec = JSON.parse(
    decodeURIComponent(canvasResult.imageUrl.replace('canvas-spec://', '')),
  );
  spec.backgroundUrl = backgroundUrl;
  spec.isHybrid = true;
  // Tanda 4B will consume styleHint in the renderer for typography choices.
  spec.styleHint = variant.styleHint;
  spec.intensity = variant.intensity;

  const imageUrl = 'canvas-spec://' + encodeURIComponent(JSON.stringify(spec));
  return { imageUrl, engine: 'hybrid' };
}

/**
 * Build a variant spec that instructs Flux to produce ONLY a background.
 * Uses styleHint to control atmosphere.
 */
function buildBackgroundVariant(variant: Variant): Variant {
  const styleId = variant.styleHint || pickDefaultStyleForLayout(variant.layout, variant.intensity);
  const style = VISUAL_STYLES[styleId];

  const directionParts = [
    'atmospheric background plate, no product, no UI, no text, no letters',
    style.composition,
    'layered foreground, midground, background for depth',
    'motivated directional lighting',
  ];

  if (variant.intensity === 'aggressive') {
    directionParts.push('dramatic chiaroscuro, deep shadow pockets, hard falloff');
  } else if (variant.intensity === 'soft') {
    directionParts.push('soft diffused light, gentle gradient, airy feel');
  } else {
    directionParts.push('balanced exposure, cinematic mood');
  }

  return {
    ...variant,
    intent: 'atmospheric backdrop only',
    visualDirection: directionParts.join('. '),
  };
}
