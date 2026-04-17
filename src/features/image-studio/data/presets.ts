export interface ImagePreset {
  id: string;
  label: string;
  hint: string;
  promptPrefix: string;
  promptSuffix: string;
  negativePrompt: string;
}

export const IMAGE_PRESETS: ImagePreset[] = [
  {
    id: 'editorial',
    label: 'Editorial', labelEs: 'Editorial',
    hint: 'Magazine-quality, refined, narrative',
    promptPrefix: 'Editorial magazine photograph, ',
    promptSuffix: '. Cinematic lighting, rich shadows, medium format film quality, 85mm lens, muted color grading with earthy tones, subtle vignette, thoughtful composition, AP photography aesthetic, professional studio lighting, high detail, 4K.',
    negativePrompt: 'cartoon, illustration, 3d render, low quality, amateur, stock photo, blurry, oversaturated, plastic skin, cheap',
  },
  {
    id: 'luxury',
    label: 'Luxury', labelEs: 'Lujo',
    hint: 'Polished, opulent, high-end brand',
    promptPrefix: 'Luxury brand campaign photograph, ',
    promptSuffix: '. Soft golden hour lighting, marble and brass surfaces, warm neutrals with subtle gold accents, shallow depth of field, exquisite texture detail, Hasselblad quality, polished sophistication, Vogue aesthetic, hyperreal, 8K.',
    negativePrompt: 'cheap, cluttered, low quality, cartoon, 3d render, stock photo, harsh lighting, overexposed',
  },
  {
    id: 'minimal',
    label: 'Minimal', labelEs: 'Minimal',
    hint: 'Clean, calm, intentional',
    promptPrefix: 'Minimalist still life photograph, ',
    promptSuffix: '. Soft diffused daylight, clean white or pale sand background, generous negative space, precise geometric composition, Scandinavian sensibility, Kinfolk aesthetic, matte finishes, understated elegance, 4K.',
    negativePrompt: 'cluttered, busy, vibrant, cartoon, 3d render, oversaturated, dark',
  },
  {
    id: 'product',
    label: 'Product shot', labelEs: 'Producto',
    hint: 'Clean product on studio backdrop',
    promptPrefix: 'Professional product photograph, ',
    promptSuffix: '. Studio lighting with soft shadows, seamless gradient backdrop, pin-sharp focus on product, subtle reflection underneath, commercial e-commerce quality, optimized for white background marketplaces, 8K.',
    negativePrompt: 'blurry, low quality, cartoon, 3d render, cluttered, cheap, harsh shadows, dust',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle', labelEs: 'Lifestyle',
    hint: 'People, environments, authentic moments',
    promptPrefix: 'Lifestyle photograph, ',
    promptSuffix: '. Natural ambient lighting, authentic candid moment, warm cinematic color grade, 35mm film texture, shallow depth of field, contemporary aspirational aesthetic, Kodak Portra 400 film grain, 4K.',
    negativePrompt: 'staged, awkward pose, cartoon, 3d render, low quality, oversaturated, fake',
  },
];

export const ASPECT_RATIOS = [
  { id: '1:1',  label: 'Square', labelEs: 'Cuadrado',   w: 1024, h: 1024 },
  { id: '16:9', label: 'Widescreen', labelEs: 'Panorámico', w: 1344, h: 768 },
  { id: '9:16', label: 'Vertical', labelEs: 'Vertical', w: 768,  h: 1344 },
  { id: '4:5',  label: 'Portrait', labelEs: 'Retrato', w: 896,  h: 1120 },
  { id: '3:2',  label: 'Landscape', w: 1216, h: 832 },
] as const;

export type AspectRatioId = typeof ASPECT_RATIOS[number]['id'];
