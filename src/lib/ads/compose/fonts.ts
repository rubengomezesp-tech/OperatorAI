import { promises as fs } from 'fs';
import path from 'path';

const FONT_FILES = {
  interBold: 'Inter-Bold.ttf',
  interRegular: 'Inter-Regular.ttf',
  playfairBold: 'PlayfairDisplay-Bold.ttf',
  playfairRegular: 'PlayfairDisplay-Regular.ttf',
} as const;

type FontKey = keyof typeof FONT_FILES;

const cache = new Map<FontKey, ArrayBuffer>();

async function loadFont(key: FontKey): Promise<ArrayBuffer> {
  const cached = cache.get(key);
  if (cached) return cached;

  const filePath = path.join(process.cwd(), 'public', 'fonts', FONT_FILES[key]);
  const buf = await fs.readFile(filePath);
  // Convert Node Buffer to ArrayBuffer (Satori expects ArrayBuffer)
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

  const [headlineBuf, bodyBuf] = await Promise.all([
    loadFont(headlineKey),
    loadFont(bodyKey),
  ]);

  return [
    { name: 'Headline', data: headlineBuf, weight: 700, style: 'normal' },
    { name: 'Body', data: bodyBuf, weight: 400, style: 'normal' },
  ];
}
