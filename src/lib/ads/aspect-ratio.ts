/**
 * Utilidad compartida de aspect ratios.
 * Única fuente de verdad para validación y normalización.
 */

import { ALLOWED_ASPECT_RATIOS, type AspectRatio } from './types';

export { ALLOWED_ASPECT_RATIOS, type AspectRatio };

/**
 * Parsea cualquier input a un array de AspectRatio válidos.
 * Acepta arrays, strings con pipes, o valores individuales.
 */
export function parseAspectRatios(input: unknown): AspectRatio[] {
  if (Array.isArray(input)) {
    return input
      .filter((v): v is AspectRatio =>
        ALLOWED_ASPECT_RATIOS.includes(v as AspectRatio)
      );
  }

  if (typeof input === 'string') {
    return input
      .split('|')
      .map(v => v.trim())
      .filter((v): v is AspectRatio =>
        ALLOWED_ASPECT_RATIOS.includes(v as AspectRatio)
      );
  }

  return ['9:16'];
}

/**
 * Devuelve UN solo aspect ratio válido (el primero).
 * Útil para /api/images/generate que solo acepta uno.
 */
export function normalizeAspectRatio(input: unknown): AspectRatio {
  const parsed = parseAspectRatios(input);
  return parsed[0] ?? '9:16';
}

/**
 * Valida que un valor sea un AspectRatio válido.
 */
export function isValidAspectRatio(value: unknown): value is AspectRatio {
  return ALLOWED_ASPECT_RATIOS.includes(value as AspectRatio);
}

/**
 * Convierte un AspectRatio a dimensiones en píxeles (para GPT-image).
 */
export function aspectRatioToSize(ratio: AspectRatio): string {
  const sizes: Record<AspectRatio, string> = {
    '1:1': '1024x1024',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '4:5': '1024x1280',
    '3:2': '1536x1024',
  };
  return sizes[ratio];
}

/**
 * Orden recomendado de generación (más importante primero).
 */
export function priorityOrder(ratios: AspectRatio[]): AspectRatio[] {
  const order: AspectRatio[] = ['9:16', '1:1', '4:5', '16:9', '3:2'];
  return ratios.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
