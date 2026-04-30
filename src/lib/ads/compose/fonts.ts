/**
 * Font loader for Satori. Caches fonts in module-level Map.
 * Fonts served from jsdelivr (Google Fonts mirror, stable).
 */

const FONT_URLS = {
  interBold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/static/Inter-Bold.ttf',
  interRegular: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/static/Inter-Regular.ttf',
  playfairBold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/playfairdisplay/static/PlayfairDisplay-Bold.ttf',
  playfairRegular: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/playfairdisplay/static/PlayfairDisplay-Regular.ttf',
} as const;

type FontKey = keyof typeof FONT_URLS;

const cache = new Map<FontKey, ArrayBuffer>();

async function loadFont(key: FontKey): Promise<ArrayBuffer> {
  const cached = cache.get(key);
  if (cached) return cached;
  const res = await fetch(FONT_URLS[key]);
  if (!res.ok) throw new Error(`Failed to load font ${key}: ${res.status}`);
  const buf = await res.arrayBuffer();
  cache.set(key, buf);
  return buf;
}

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: 'normal';
};

export async function getFontsForPreset(preset: string): Promise<SatoriFont[]> {
  const isLuxury = preset === 'luxury-minimal';
  const headlineKey: FontKey = isLuxury ? 'playfairBold' : 'interBold';
  const bodyKey: FontKey = isLuxury ? 'playfairRegular' : 'interRegular';

  const [headlineBuf, bodyBuf] = await Promise.all([
    loadFont(headlineKey),
    loadFont(bodyKey),
  ]);

  return [
    { name: 'Headline', data: headlineBuf, weight: 700, style: 'normal' },
    { name: 'Body', data: bodyBuf, weight: 400, style: 'normal' },
  ];
}
