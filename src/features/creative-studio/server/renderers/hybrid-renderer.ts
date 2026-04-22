import 'server-only';
import { renderFlux } from './flux-renderer';
import { renderCanvas } from './canvas-renderer';
import type { RenderInput, RenderOutput } from './canvas-renderer';

/**
 * HYBRID RENDERER
 * 1. Flux generates a premium atmospheric background (no UI, no text, no product).
 * 2. Canvas spec carries the real logo, UI, and copy on top of that background.
 *
 * The final composition happens in the browser (Tanda 3) using the same
 * canvas-spec-renderer that handles pure canvas variants. The spec just
 * includes an extra backgroundUrl field and isHybrid: true.
 */
export async function renderHybrid(input: RenderInput): Promise<RenderOutput> {
  const { variant } = input;

  // Build a background-only variant for flux
  const bgVariant = {
    ...variant,
    renderPrompt:
      (variant.renderPrompt || '') +
      ' abstract premium background, ' +
      (variant.mood || 'cinematic atmosphere'),
    intent: 'atmospheric background only, no product, no UI, no text, no letters',
  };

  let backgroundUrl: string | undefined;
  try {
    const bg = await renderFlux({ ...input, variant: bgVariant });
    backgroundUrl = bg.imageUrl;
  } catch (err) {
    console.error('[hybrid-renderer] flux background failed, falling back to pure canvas:', err);
    return renderCanvas(input);
  }

  // Build the canvas spec with the generated background
  const canvasResult = await renderCanvas(input);
  const spec = JSON.parse(
    decodeURIComponent(canvasResult.imageUrl.replace('canvas-spec://', '')),
  );
  spec.backgroundUrl = backgroundUrl;
  spec.isHybrid = true;

  const imageUrl = 'canvas-spec://' + encodeURIComponent(JSON.stringify(spec));
  return { imageUrl, engine: 'hybrid' };
}
