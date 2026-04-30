import {
  INTER_BOLD,
  INTER_REGULAR,
  PLAYFAIR_BOLD,
  PLAYFAIR_REGULAR,
} from './fonts-data';

const FONT_B64 = {
  interBold: INTER_BOLD,
  interRegular: INTER_REGULAR,
  playfairBold: PLAYFAIR_BOLD,
  playfairRegular: PLAYFAIR_REGULAR,
} as const;

type FontKey = keyof typeof FONT_B64;

const cache = new Map<FontKey, ArrayBuffer>();

function decodeFont(key: FontKey): ArrayBuffer {
  const cached = cache.get(key);
  if (cached) return cached;
  const buf = Buffer.from(FONT_B64[key], 'base64');
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  cache.set(key, arrayBuffer);
  return arrayBuffer;
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

  return [
    { name: 'Headline', data: decodeFont(headlineKey), weight: 700, style: 'normal' },
    { name: 'Body', data: decodeFont(bodyKey), weight: 400, style: 'normal' },
  ];
}
