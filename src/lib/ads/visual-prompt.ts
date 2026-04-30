/**
 * CAPA 3 — Visual Prompt Builder
 * Genera prompts optimizados para imagen base de ads.
 * Reglas clave:
 *  - SOLO fondo/atmósfera/iluminación — sin texto, sin logos, sin caras
 *  - Espacio negativo para tipografía
 *  - Estructurado por preset
 */

export type AdPreset = 'luxury-minimal' | 'aggressive' | 'clean-conversion' | 'product-demo';
export type AdAspectRatio = '9:16' | '1:1' | '4:5' | '16:9';

interface PresetConfig {
  baseAtmosphere: string;
  lighting: string;
  colorPalette: string;
  composition: string;
  negativePrompt: string;
}

const PRESET_CONFIGS: Record<AdPreset, PresetConfig> = {
  'luxury-minimal': {
    baseAtmosphere: 'ultra-premium dark studio environment, deep black background, vast empty space for text overlay',
    lighting: 'dramatic single-source golden rim lighting, subtle god rays, cinematic depth',
    colorPalette: 'rich blacks, warm gold (#D4AF37) accents, deep charcoal, minimal color palette',
    composition: 'extreme negative space occupying 60% of frame, subject bottom-third, breathing room for headline',
    negativePrompt: 'text, letters, words, watermark, logo, busy background, cluttered, colorful, bright, neon, people, faces, cartoon',
  },
  'aggressive': {
    baseAtmosphere: 'high-energy dark environment, dynamic tension, powerful industrial aesthetic',
    lighting: 'harsh high-contrast lighting, dramatic shadows, intense directional light, electric atmosphere',
    colorPalette: 'deep blacks, intense gold, stark white highlights, high saturation accents',
    composition: 'bold diagonal composition, strong visual tension, large negative space upper-half for headline',
    negativePrompt: 'text, letters, words, watermark, logo, soft, pastel, minimalist, calm, serene, faces, people',
  },
  'clean-conversion': {
    baseAtmosphere: 'clean bright studio background, professional product photography aesthetic, Meta Ads style',
    lighting: 'soft even studio lighting, minimal shadows, clean and approachable',
    colorPalette: 'white, light grey, soft blue accents, clean neutral tones',
    composition: 'centered composition, ample white space, product-ready negative areas on sides',
    negativePrompt: 'text, letters, words, watermark, logo, dark, moody, dramatic, grungy, faces, people',
  },
  'product-demo': {
    baseAtmosphere: 'neutral gradient background, tech product photography environment, sleek and modern',
    lighting: 'soft diffused studio lighting, subtle reflections, professional tech aesthetic',
    colorPalette: 'cool greys, soft gradients, subtle blue or purple tones, modern neutral palette',
    composition: 'wide open center space for product placement overlay, clean edges, minimal distractions',
    negativePrompt: 'text, letters, words, watermark, logo, cluttered, busy, dark, people, faces, hands',
  },
};

const ASPECT_RATIO_RULES: Record<AdAspectRatio, string> = {
  '9:16': 'vertical portrait composition, top 30% clear for headline, bottom 20% for CTA area',
  '1:1': 'square composition, centered visual weight, balanced negative space on all sides',
  '4:5': 'near-vertical composition optimized for Instagram feed, visual interest in lower half',
  '16:9': 'wide cinematic composition, horizontal negative space on left third for text overlay',
};

/**
 * Builds the final visual prompt for ad image generation.
 * Output is designed for gpt-image-1 or Flux.
 */
export function buildAdVisualPrompt({
  preset,
  aspectRatio,
  customAtmosphere,
  hasReference,
}: {
  preset: AdPreset;
  aspectRatio: AdAspectRatio;
  customAtmosphere?: string;
  hasReference?: boolean;
}): { prompt: string; negativePrompt: string } {
  const config = PRESET_CONFIGS[preset];
  const aspectRule = ASPECT_RATIO_RULES[aspectRatio];

  // ── REFERENCE MODE: short prompt that PRESERVES the user's image ──
  // gpt-image-1 with reference images respects them better when prompt is concise
  // and explicitly asks to keep the subject prominent.
  if (hasReference) {
    const lightingByPreset: Record<AdPreset, string> = {
      'luxury-minimal': 'cinematic golden rim lighting, dark moody atmosphere',
      'aggressive': 'high contrast dramatic lighting, intense energy',
      'clean-conversion': 'soft bright studio lighting, clean professional',
      'product-demo': 'neutral studio lighting, modern tech aesthetic',
    };
    const refPrompt = [
      'Premium advertising composition.',
      'Use the provided image as the dominant central subject — keep it sharp, prominent, fully visible at 100% opacity.',
      `Add ${lightingByPreset[preset]} around the subject.`,
      'Background: ' + config.colorPalette + '.',
      aspectRule,
      'Leave clear negative space for text overlay (top and bottom).',
      'NO text, NO logos, NO typography in the output image.',
    ].join(' ');
    return { prompt: refPrompt, negativePrompt: config.negativePrompt };
  }

  // ── DEFAULT MODE: full scene generation ──
  const parts = [
    customAtmosphere ?? config.baseAtmosphere,
    config.lighting,
    config.colorPalette,
    config.composition,
    aspectRule,
    'photorealistic, ultra-high quality, 8K, professional advertising photography',
    'NO text, NO typography, NO words, NO letters, NO logos anywhere in the image',
  ];

  return {
    prompt: parts.join(', '),
    negativePrompt: config.negativePrompt,
  };
}

/**
 * Maps AdPreset to the existing IMAGE_PRESETS id if applicable.
 * Fallback: returns undefined (use raw prompt).
 */
export function presetToImagePresetId(preset: AdPreset): string | undefined {
  const map: Partial<Record<AdPreset, string>> = {
    'luxury-minimal': 'luxury',
    'aggressive': 'editorial',
    'clean-conversion': 'startup',
    'product-demo': 'startup',
  };
  return map[preset];
}
