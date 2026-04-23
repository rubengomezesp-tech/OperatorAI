// Creative Studio v2 — Visual style presets
// Each style controls prompt language, palette tuning, and typography hints.
// Used by: creative-planner, flux-renderer, hybrid-renderer, canvas-spec-renderer.

export type VisualStyle =
  | 'luxury'
  | 'minimal'
  | 'startup'
  | 'aggressive'
  | 'cinematic';

export interface VisualStyleSpec {
  id: VisualStyle;
  // Art-direction phrases injected into Flux prompt
  promptHints: string[];
  // Negative cues fed to Flux (real negative_prompt, not avoid clause)
  negativeHints: string[];
  // Tone of typography for canvas-spec-renderer (Tanda 4B will consume)
  typography: {
    heading: 'serif' | 'sans' | 'display';
    body: 'sans' | 'mono';
    weightH1: number; // 300-900
    weightBody: number;
    tracking: 'tight' | 'normal' | 'wide';
  };
  // Palette role tuning (applied on top of brief.palette)
  paletteTuning: {
    saturation: 'low' | 'medium' | 'high';
    contrast: 'soft' | 'medium' | 'hard';
    prefersDark: boolean;
  };
  // Compositional language for prompts
  composition: string;
}

export const VISUAL_STYLES: Record<VisualStyle, VisualStyleSpec> = {
  luxury: {
    id: 'luxury',
    promptHints: [
      'editorial fashion photography aesthetic',
      'polished marble or brushed metal surfaces',
      'directional rim lighting',
      'shallow depth of field with bokeh',
      'restrained color grading, black and gold, champagne highlights',
      'museum-grade product placement',
    ],
    negativeHints: [
      'neon colors',
      'cartoon',
      'low-budget advertising',
      'busy background',
      'stock photo',
      'generic gradient',
    ],
    typography: {
      heading: 'serif',
      body: 'sans',
      weightH1: 400,
      weightBody: 300,
      tracking: 'tight',
    },
    paletteTuning: { saturation: 'low', contrast: 'soft', prefersDark: true },
    composition:
      'centered hero with breathing room, 30 percent negative space, soft vignette, refined balance',
  },
  minimal: {
    id: 'minimal',
    promptHints: [
      'scandinavian design sensibility',
      'flat daylight, soft shadows',
      'single subject on clean surface',
      'natural palette, muted tones',
      'high key lighting',
      'generous whitespace',
    ],
    negativeHints: [
      'busy composition',
      'heavy gradient',
      'dramatic shadow',
      'chrome',
      'glow abuse',
    ],
    typography: {
      heading: 'sans',
      body: 'sans',
      weightH1: 600,
      weightBody: 400,
      tracking: 'normal',
    },
    paletteTuning: { saturation: 'low', contrast: 'soft', prefersDark: false },
    composition:
      'subject at rule-of-thirds intersection, flat floor plane, 40 to 60 percent negative space',
  },
  startup: {
    id: 'startup',
    promptHints: [
      'contemporary tech ad aesthetic',
      'clean studio lighting, soft gradient backdrop',
      'product hero with subtle glow outline',
      'modern, optimistic, crisp',
      'single focal subject',
      'palette anchored by the brand color',
    ],
    negativeHints: [
      'vintage filter',
      'heavy noise',
      'overexposed',
      'dated design',
    ],
    typography: {
      heading: 'sans',
      body: 'sans',
      weightH1: 700,
      weightBody: 400,
      tracking: 'normal',
    },
    paletteTuning: { saturation: 'medium', contrast: 'medium', prefersDark: false },
    composition:
      'product anchored slightly left or right of center, negative space for headline, subtle geometric accents',
  },
  aggressive: {
    id: 'aggressive',
    promptHints: [
      'high-contrast performance advertising',
      'dramatic single key light',
      'hard shadows, deep blacks',
      'product dominant in frame',
      'intense color accent from brand palette',
      'urgency through framing, tight crop',
    ],
    negativeHints: [
      'soft lighting',
      'pastel',
      'flat daylight',
      'low contrast',
      'centered symmetry',
    ],
    typography: {
      heading: 'sans',
      body: 'sans',
      weightH1: 900,
      weightBody: 500,
      tracking: 'tight',
    },
    paletteTuning: { saturation: 'high', contrast: 'hard', prefersDark: true },
    composition:
      'tight crop on hero, diagonal energy, off-center subject, negative space reserved for punchy headline',
  },
  cinematic: {
    id: 'cinematic',
    promptHints: [
      'cinematic film still aesthetic',
      'anamorphic lens bokeh',
      'teal and amber grade OR monochrome with single accent',
      'layered foreground, midground, background',
      'atmospheric haze',
      'motivated directional lighting',
    ],
    negativeHints: [
      'flat lighting',
      'uniform background',
      'CGI look',
      '3D render aesthetic',
      'cheap glow',
    ],
    typography: {
      heading: 'display',
      body: 'sans',
      weightH1: 500,
      weightBody: 400,
      tracking: 'wide',
    },
    paletteTuning: { saturation: 'medium', contrast: 'hard', prefersDark: true },
    composition:
      'three-layer depth, subject mid-frame with foreground occlusion, atmospheric perspective',
  },
};

export function pickDefaultStyleForLayout(
  layout: string,
  intensity: 'soft' | 'medium' | 'aggressive',
): VisualStyle {
  // Sensible defaults when planner does not pick one
  if (intensity === 'aggressive') return 'aggressive';
  if (layout === 'story_ad') return 'cinematic';
  if (layout === 'minimal_branding') return 'minimal';
  if (layout === 'ui_focus') return 'minimal';
  if (layout === 'feature_grid') return 'startup';
  return 'luxury';
}
