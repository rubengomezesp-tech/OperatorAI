// Ad templates — applied in one click
export interface TextBlock {
  id: string;
  type: 'headline' | 'subtitle' | 'cta' | 'highlight' | 'small';
  text: string;
  x: number; // % from left
  y: number; // % from top
  align: 'left' | 'center' | 'right';
  fontSize: number; // px
  fontFamily: 'sans' | 'serif';
  fontWeight: 'light' | 'normal' | 'bold' | 'black';
  color: 'white' | 'gold' | 'black' | 'muted';
  style?: 'button' | 'pill' | 'underline' | 'badge';
}

export interface AdTemplate {
  id: string;
  name: string;
  nameEs: string;
  desc: string;
  blocks: (copy: { hook: string; message: string; cta: string; headline?: string }) => TextBlock[];
}

export const TEMPLATES: AdTemplate[] = [
  {
    id: 'luxury',
    name: 'Luxury',
    nameEs: 'Luxury',
    desc: 'Serif, centered, gold CTA',
    blocks: (c) => [
      { id: 'h', type: 'headline', text: c.hook, x: 50, y: 42, align: 'center', fontSize: 48, fontFamily: 'serif', fontWeight: 'normal', color: 'white' },
      { id: 's', type: 'subtitle', text: c.message, x: 50, y: 54, align: 'center', fontSize: 18, fontFamily: 'serif', fontWeight: 'light', color: 'muted' },
      { id: 'c', type: 'cta', text: c.cta, x: 50, y: 72, align: 'center', fontSize: 16, fontFamily: 'sans', fontWeight: 'normal', color: 'gold', style: 'pill' },
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    nameEs: 'Performance',
    desc: 'Bold hook, strong CTA',
    blocks: (c) => [
      { id: 'h', type: 'headline', text: c.hook, x: 6, y: 8, align: 'left', fontSize: 52, fontFamily: 'sans', fontWeight: 'black', color: 'white' },
      { id: 's', type: 'subtitle', text: c.message, x: 6, y: 28, align: 'left', fontSize: 16, fontFamily: 'sans', fontWeight: 'normal', color: 'muted' },
      { id: 'c', type: 'cta', text: c.cta, x: 50, y: 88, align: 'center', fontSize: 16, fontFamily: 'sans', fontWeight: 'bold', color: 'black', style: 'button' },
    ],
  },
  {
    id: 'story_minimal',
    name: 'Story Minimal',
    nameEs: 'Story Minimal',
    desc: 'One big sentence, high contrast',
    blocks: (c) => [
      { id: 'h', type: 'headline', text: c.hook, x: 50, y: 45, align: 'center', fontSize: 56, fontFamily: 'sans', fontWeight: 'bold', color: 'white' },
      { id: 'c', type: 'cta', text: c.cta, x: 50, y: 80, align: 'center', fontSize: 14, fontFamily: 'sans', fontWeight: 'normal', color: 'gold', style: 'underline' },
    ],
  },
  {
    id: 'editorial',
    name: 'Editorial',
    nameEs: 'Editorial',
    desc: 'Magazine style, elegant',
    blocks: (c) => [
      { id: 'b', type: 'highlight', text: 'NEW', x: 6, y: 6, align: 'left', fontSize: 11, fontFamily: 'sans', fontWeight: 'bold', color: 'gold', style: 'badge' },
      { id: 'h', type: 'headline', text: c.hook, x: 6, y: 65, align: 'left', fontSize: 44, fontFamily: 'serif', fontWeight: 'normal', color: 'white' },
      { id: 's', type: 'subtitle', text: c.message, x: 6, y: 80, align: 'left', fontSize: 14, fontFamily: 'sans', fontWeight: 'light', color: 'muted' },
      { id: 'c', type: 'cta', text: c.cta + ' →', x: 6, y: 90, align: 'left', fontSize: 13, fontFamily: 'sans', fontWeight: 'bold', color: 'gold' },
    ],
  },
  {
    id: 'viral',
    name: 'Viral',
    nameEs: 'Viral',
    desc: 'Emojis, bold, high energy',
    blocks: (c) => [
      { id: 'h', type: 'headline', text: '🔥 ' + c.hook, x: 50, y: 30, align: 'center', fontSize: 46, fontFamily: 'sans', fontWeight: 'black', color: 'white' },
      { id: 's', type: 'subtitle', text: c.message, x: 50, y: 52, align: 'center', fontSize: 18, fontFamily: 'sans', fontWeight: 'normal', color: 'white' },
      { id: 'c', type: 'cta', text: '⚡ ' + c.cta, x: 50, y: 78, align: 'center', fontSize: 17, fontFamily: 'sans', fontWeight: 'bold', color: 'black', style: 'button' },
    ],
  },
];

export const ASSET_ICONS = [
  { emoji: '→', label: 'Arrow' },
  { emoji: '✓', label: 'Check' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '⚡', label: 'Lightning' },
  { emoji: '❗', label: 'Exclaim' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '💎', label: 'Diamond' },
  { emoji: '📱', label: 'Phone' },
  { emoji: '💰', label: 'Money' },
  { emoji: '🎯', label: 'Target' },
  { emoji: '✨', label: 'Sparkle' },
];

export const COLOR_MAP: Record<string, string> = {
  white: '#FFFFFF',
  gold: '#C9A863',
  black: '#000000',
  muted: 'rgba(255,255,255,0.7)',
};
