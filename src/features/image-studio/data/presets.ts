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
    label: 'Editorial',
    hint: 'Magazine-quality, refined, narrative',
    promptPrefix: 'Editorial magazine photograph, ',
    promptSuffix: '. Cinematic lighting, rich shadows, medium format film quality, 85mm lens, muted color grading with earthy tones, subtle vignette, thoughtful composition, AP photography aesthetic, professional studio lighting, high detail, 4K.',
    negativePrompt: 'cartoon, illustration, 3d render, low quality, amateur, stock photo, blurry, oversaturated, plastic skin, cheap',
  },
  {
    id: 'luxury',
    label: 'Luxury',
    hint: 'Polished, opulent, high-end brand',
    promptPrefix: 'Luxury brand campaign photograph, ',
    promptSuffix: '. Soft golden hour lighting, marble and brass surfaces, warm neutrals with subtle gold accents, shallow depth of field, exquisite texture detail, Hasselblad quality, polished sophistication, Vogue aesthetic, hyperreal, 8K.',
    negativePrompt: 'cheap, cluttered, low quality, cartoon, 3d render, stock photo, harsh lighting, overexposed',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    hint: 'Clean, calm, intentional',
    promptPrefix: 'Minimalist still life photograph, ',
    promptSuffix: '. Soft diffused daylight, clean white or pale sand background, generous negative space, precise geometric composition, Scandinavian sensibility, Kinfolk aesthetic, matte finishes, understated elegance, 4K.',
    negativePrompt: 'cluttered, busy, vibrant, cartoon, 3d render, oversaturated, dark',
  },
  {
    id: 'product',
    label: 'Product shot',
    hint: 'Clean product on studio backdrop',
    promptPrefix: 'Professional product photograph, ',
    promptSuffix: '. Studio lighting with soft shadows, seamless gradient backdrop, pin-sharp focus on product, subtle reflection underneath, commercial e-commerce quality, optimized for white background marketplaces, 8K.',
    negativePrompt: 'blurry, low quality, cartoon, 3d render, cluttered, cheap, harsh shadows, dust',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    hint: 'People, environments, authentic moments',
    promptPrefix: 'Lifestyle photograph, ',
    promptSuffix: '. Natural ambient lighting, authentic candid moment, warm cinematic color grade, 35mm film texture, shallow depth of field, contemporary aspirational aesthetic, Kodak Portra 400 film grain, 4K.',
    negativePrompt: 'staged, awkward pose, cartoon, 3d render, low quality, oversaturated, fake',
  },
  {
    id: 'ig-feed',
    label: 'Instagram Feed',
    hint: 'Square, scroll-stopping, on-brand feed post',
    promptPrefix: 'Instagram feed post, square format, scroll-stopping visual, ',
    promptSuffix: '. Clean composition, vibrant but cohesive colors, modern aesthetic, high contrast, social media optimized, professional photography, lifestyle brand feel, 4K.',
    negativePrompt: 'blurry, low quality, text overlay, watermark, amateur, cluttered',
  },
  {
    id: 'ig-story',
    label: 'Instagram Story',
    hint: 'Vertical 9:16, immersive, full-screen impact',
    promptPrefix: 'Instagram story format, vertical 9:16, immersive full-screen visual, ',
    promptSuffix: '. Dynamic composition, bold colors, modern lifestyle aesthetic, cinematic lighting, engaging visual hierarchy, mobile-optimized, high resolution.',
    negativePrompt: 'horizontal, landscape, low quality, blurry, amateur',
  },
  {
    id: 'ig-reel',
    label: 'Reel Cover',
    hint: 'Vertical thumbnail, eye-catching, dynamic',
    promptPrefix: 'Video thumbnail cover, vertical format, eye-catching dynamic composition, ',
    promptSuffix: '. Bold visual impact, cinematic color grading, modern aesthetic, action moment frozen, professional quality, scroll-stopping.',
    negativePrompt: 'blurry, static, boring, low quality, amateur',
  },
  {
    id: 'campaign',
    label: 'Campaign',
    hint: 'Ad-ready, commercial, persuasive visual',
    promptPrefix: 'Commercial advertising campaign photograph, ',
    promptSuffix: '. Studio-quality lighting, product-focused composition, aspirational lifestyle, clean background, brand-consistent color palette, magazine-quality, 8K resolution.',
    negativePrompt: 'amateur, low quality, messy, cluttered, cheap looking',
  },
  {
    id: 'branding',
    label: 'Brand Identity',
    hint: 'Logo backdrop, brand colors, identity system',
    promptPrefix: 'Brand identity visual, sophisticated and cohesive, ',
    promptSuffix: '. Minimalist composition, brand-consistent color palette, premium texture and materials, clean negative space, modern design aesthetic, suitable for brand guidelines.',
    negativePrompt: 'cluttered, amateur, inconsistent, cheap, low quality',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    hint: 'Professional, corporate, thought leadership',
    promptPrefix: 'Professional LinkedIn post visual, corporate yet modern, ',
    promptSuffix: '. Clean professional aesthetic, subtle color palette, business environment, thought leadership visual, high quality, 16:9 or square format.',
    negativePrompt: 'casual, unprofessional, cluttered, low quality',
  },
];

export const ASPECT_RATIOS = [
  { id: '1:1',  label: 'Square',   w: 1024, h: 1024 },
  { id: '16:9', label: 'Widescreen', w: 1344, h: 768 },
  { id: '9:16', label: 'Vertical', w: 768,  h: 1344 },
  { id: '4:5',  label: 'Portrait', w: 896,  h: 1120 },
  { id: '3:2',  label: 'Landscape', w: 1216, h: 832 },
] as const;

export type AspectRatioId = typeof ASPECT_RATIOS[number]['id'];

export function findPreset(id: string): ImagePreset | undefined {
  return IMAGE_PRESETS.find((p) => p.id === id);
}
