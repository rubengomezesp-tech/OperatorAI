import type { VeoModel } from '../server/veo-client';

export interface VideoModelOption {
  id: VeoModel;
  name: string;
  tagline: string;
  costPerSecond: number;
  badge?: string;
}

export const VIDEO_MODELS: VideoModelOption[] = [
  {
    id: 'veo-3.1-lite-generate-preview',
    name: 'Veo 3.1 Lite',
    tagline: 'Fast & affordable. Best for iteration.',
    costPerSecond: 0.075,
    badge: 'CHEAPEST',
  },
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast',
    tagline: 'Balanced quality + speed. Native audio.',
    costPerSecond: 0.15,
    badge: 'RECOMMENDED',
  },
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1 Standard',
    tagline: 'Top cinematic quality. Slower.',
    costPerSecond: 0.40,
    badge: 'PREMIUM',
  },
];

export interface VideoPreset {
  id: string;
  label: string;
  promptHint: string;
}

export const VIDEO_PRESETS: VideoPreset[] = [
  {
    id: 'product',
    label: 'Product showcase',
    promptHint: 'Cinematic close-up of [product] rotating slowly on a marble surface, soft golden light from the left, shallow depth of field, professional studio look. 4K cinematic.',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle scene',
    promptHint: 'A confident woman in her 30s, golden hour, walking through a sunlit Mediterranean street, slow motion, grain, cinematic mood. Camera tracks her from behind at chest height.',
  },
  {
    id: 'foodbeverage',
    label: 'Food & beverage',
    promptHint: 'Macro shot of [drink] being poured into a crystal glass, ice cubes splashing in slow motion, golden light, shallow depth of field. Premium ad quality.',
  },
  {
    id: 'fashion',
    label: 'Fashion editorial',
    promptHint: 'High fashion model walking confidently in [outfit], minimalist white studio, dramatic side lighting, slow motion, Vogue editorial aesthetic.',
  },
  {
    id: 'animation',
    label: 'Animated explainer',
    promptHint: 'Smooth 2D motion graphics of [concept], minimalist clean design, soft pastel colors, professional explainer video style.',
  },
];

export const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 — Landscape', tag: 'YouTube/desktop' },
  { id: '9:16', label: '9:16 — Vertical', tag: 'TikTok/Reels/Stories' },
] as const;
