// Creative Studio v2 — Visual Style System v2
//
// Design principle: each style represents a DIFFERENT visual world.
// 5 variants in a campaign → 5 different styles → 5 different brand feelings.
//
// Prompt construction is layered:
//   subject → composition → lighting → palette → camera → reference → quality
//
// Each style drives those layers with realistic photography/advertising language.
// NO brand names (Flux/TOS). Reference via medium: "editorial fashion photography",
// "Apple-style product shot", "Swiss design book".

export type VisualStyle =
  | 'dark_cinematic'
  | 'clean_bright'
  | 'luxury_beige'
  | 'bold_startup'
  | 'editorial_magazine'
  | 'tech_product_white'
  | 'social_media_ad'
  | 'lifestyle_product'
  | 'minimal_swiss';

// Legacy style support for campaigns created before style system expansion.
// Maps old styleHint values to their closest new equivalent.
const LEGACY_STYLE_MAP: Record<string, VisualStyle> = {
  luxury: 'luxury_beige',
  minimal: 'minimal_swiss',
  startup: 'bold_startup',
  aggressive: 'social_media_ad',
  cinematic: 'dark_cinematic',
};

/**
 * Normalizes any style value to a valid VisualStyle.
 * - If it's already valid, returns as is
 * - If it's a legacy style, maps to new equivalent
 * - If unknown, returns clean_bright as safe default
 */
export function normalizeVisualStyle(style: unknown): VisualStyle {
  if (typeof style !== 'string') return 'clean_bright';
  if (style in VISUAL_STYLES) return style as VisualStyle;
  if (style in LEGACY_STYLE_MAP) return LEGACY_STYLE_MAP[style];
  return 'clean_bright';
}

export const ALL_STYLES: VisualStyle[] = [
  'dark_cinematic',
  'clean_bright',
  'luxury_beige',
  'bold_startup',
  'editorial_magazine',
  'tech_product_white',
  'social_media_ad',
  'lifestyle_product',
  'minimal_swiss',
];

export interface VisualStyleSpec {
  id: VisualStyle;
  displayName: string;

  // Prompt fragments composed by the renderer
  // Each array returns 3-5 short phrases, not a wall of adjectives
  lighting: string[];          // how light hits the scene
  composition: string[];       // framing, depth, subject placement
  palette: string[];           // color behavior
  camera: string[];            // lens, aperture, focus
  reference: string[];         // medium-based aesthetic (NOT brand names)

  // Hints sent to Flux as negative_prompt to avoid style drift
  negativeHints: string[];

  // Typography hint for ad-editor (kept for compat)
  typography: {
    heading: 'serif' | 'sans' | 'display';
    body: 'sans' | 'mono';
    weightH1: number;
    weightBody: number;
    tracking: 'tight' | 'normal' | 'wide';
  };

  // Layout compatibility scoring (0-10). Higher = style works well for this layout.
  layoutAffinity: {
    hero_app: number;
    feature_grid: number;
    story_ad: number;
    minimal_branding: number;
    ui_focus: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// STYLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export const VISUAL_STYLES: Record<VisualStyle, VisualStyleSpec> = {
  // ────────────────────────────────────────────────────────────
  // DARK CINEMATIC
  // Noir film stills, luxury car commercials, fragrance ads
  // ────────────────────────────────────────────────────────────
  dark_cinematic: {
    id: 'dark_cinematic',
    displayName: 'Dark Cinematic',
    lighting: [
      'moody low-key lighting',
      'single hard key light with strong rim light',
      'atmospheric haze catching the light',
    ],
    composition: [
      'diagonal dynamic composition',
      'layered foreground midground background depth',
      'off-center subject with negative space',
    ],
    palette: [
      'desaturated color grade',
      'amber and teal contrast OR monochrome with one color accent',
      'deep shadows retaining detail, no crushed blacks',
    ],
    camera: [
      '35mm anamorphic lens',
      'f/2.8 aperture',
      'shallow depth of field with soft bokeh',
    ],
    reference: [
      'cinematic film still aesthetic',
      'luxury automotive commercial mood',
    ],
    negativeHints: [
      'flat lighting',
      'bright daylight',
      'cheerful tone',
      'pastel colors',
      'plain white background',
      'cartoon',
    ],
    typography: {
      heading: 'display',
      body: 'sans',
      weightH1: 500,
      weightBody: 400,
      tracking: 'wide',
    },
    layoutAffinity: {
      hero_app: 7,
      feature_grid: 4,
      story_ad: 10,
      minimal_branding: 6,
      ui_focus: 3,
    },
  },

  // ────────────────────────────────────────────────────────────
  // CLEAN BRIGHT
  // Apple product ads, scandinavian catalogs, fresh SaaS
  // ────────────────────────────────────────────────────────────
  clean_bright: {
    id: 'clean_bright',
    displayName: 'Clean Bright',
    lighting: [
      'high-key soft daylight',
      'even fill lighting with minimal shadows',
      'bright airy atmosphere',
    ],
    composition: [
      'centered hero or rule of thirds',
      'generous negative space',
      'flat plane with clean horizon',
    ],
    palette: [
      'bright whites with soft pastel accents',
      'low contrast fresh tones',
      'minimal color, subject pops through form not saturation',
    ],
    camera: [
      '50mm lens',
      'f/5.6 aperture',
      'crisp edge-to-edge focus',
    ],
    reference: [
      'modern product advertising aesthetic',
      'scandinavian catalog photography',
    ],
    negativeHints: [
      'moody lighting',
      'dark shadows',
      'heavy grain',
      'vintage filter',
      'dramatic contrast',
      'black background',
    ],
    typography: {
      heading: 'sans',
      body: 'sans',
      weightH1: 600,
      weightBody: 400,
      tracking: 'normal',
    },
    layoutAffinity: {
      hero_app: 10,
      feature_grid: 8,
      story_ad: 5,
      minimal_branding: 9,
      ui_focus: 9,
    },
  },

  // ────────────────────────────────────────────────────────────
  // LUXURY BEIGE
  // Warm luxury editorials, high-end interiors, refined goods
  // NOT black/gold — that's an overused cliché
  // ────────────────────────────────────────────────────────────
  luxury_beige: {
    id: 'luxury_beige',
    displayName: 'Luxury Beige',
    lighting: [
      'warm directional window light or golden hour',
      'soft shadows with amber warmth',
      'controlled exposure preserving highlight detail',
    ],
    composition: [
      'centered or rule of thirds with generous breathing room',
      'refined object placement on textured surface',
      'negative space dominating 40 percent of frame',
    ],
    palette: [
      'cream beige camel warm taupe palette',
      'no pure black, shadows remain warm brown',
      'occasional olive or burgundy accent',
    ],
    camera: [
      '85mm portrait lens',
      'f/2.8 aperture',
      'shallow depth of field with creamy bokeh',
    ],
    reference: [
      'warm luxury editorial photography',
      'high-end interior design magazine',
    ],
    negativeHints: [
      'black background',
      'gold accents on black',
      'cold blue tones',
      'neon',
      'saturated colors',
      'harsh shadows',
    ],
    typography: {
      heading: 'serif',
      body: 'sans',
      weightH1: 400,
      weightBody: 300,
      tracking: 'tight',
    },
    layoutAffinity: {
      hero_app: 8,
      feature_grid: 6,
      story_ad: 7,
      minimal_branding: 10,
      ui_focus: 5,
    },
  },

  // ────────────────────────────────────────────────────────────
  // BOLD STARTUP
  // Modern SaaS hero shots, tech product launches, contemporary branding
  // ────────────────────────────────────────────────────────────
  bold_startup: {
    id: 'bold_startup',
    displayName: 'Bold Startup',
    lighting: [
      'clean studio lighting with color gradient backdrop',
      'subtle colored ambient fill',
      'soft glow around subject edges',
    ],
    composition: [
      'product or subject anchored center with geometric accents',
      'floating elements suggesting depth',
      'dynamic but structured layout',
    ],
    palette: [
      'one dominant vibrant brand color',
      'secondary complementary tone',
      'high saturation controlled by clean backdrop',
    ],
    camera: [
      '35mm lens',
      'f/8 aperture',
      'deep focus with crisp subject',
    ],
    reference: [
      'contemporary tech brand photography',
      'modern SaaS hero imagery',
    ],
    negativeHints: [
      'vintage aesthetic',
      'film grain',
      'desaturated tones',
      'moody lighting',
      'dated design elements',
    ],
    typography: {
      heading: 'sans',
      body: 'sans',
      weightH1: 700,
      weightBody: 400,
      tracking: 'normal',
    },
    layoutAffinity: {
      hero_app: 9,
      feature_grid: 10,
      story_ad: 6,
      minimal_branding: 7,
      ui_focus: 8,
    },
  },

  // ────────────────────────────────────────────────────────────
  // EDITORIAL MAGAZINE
  // Vogue / GQ / Kinfolk / Fantastic Man — sophisticated, curated
  // ────────────────────────────────────────────────────────────
  editorial_magazine: {
    id: 'editorial_magazine',
    displayName: 'Editorial Magazine',
    lighting: [
      'natural window light with directional quality',
      'soft studio lighting with character',
      'motivated light source visible in frame',
    ],
    composition: [
      'off-center asymmetric composition',
      'subject framed by environment',
      'documentary-aspirational perspective',
    ],
    palette: [
      'natural tones with single chromatic accent',
      'controlled color grading preserving skin tones',
      'film-inspired color science',
    ],
    camera: [
      '50mm or 85mm prime lens',
      'f/2.8 aperture',
      'shallow depth of field with atmospheric bokeh',
    ],
    reference: [
      'editorial fashion photography',
      'magazine feature spread aesthetic',
    ],
    negativeHints: [
      'CGI look',
      '3D render',
      'perfect symmetry',
      'studio cyc backdrop',
      'obvious advertising layout',
      'cartoon',
    ],
    typography: {
      heading: 'serif',
      body: 'sans',
      weightH1: 400,
      weightBody: 400,
      tracking: 'normal',
    },
    layoutAffinity: {
      hero_app: 6,
      feature_grid: 5,
      story_ad: 9,
      minimal_branding: 8,
      ui_focus: 4,
    },
  },

  // ────────────────────────────────────────────────────────────
  // TECH PRODUCT WHITE
  // Apple product page, Dyson, Teenage Engineering — pure minimalism
  // ────────────────────────────────────────────────────────────
  tech_product_white: {
    id: 'tech_product_white',
    displayName: 'Tech Product White',
    lighting: [
      'soft overhead key with subtle fill',
      'no harsh shadows, studio cyclorama backdrop',
      'gentle reflection on subject surface',
    ],
    composition: [
      'product centered or slightly off-axis',
      'floating on seamless white plane',
      'precise clean product placement',
    ],
    palette: [
      'pure white background',
      'subject retains its own natural color',
      'minimal environmental color intrusion',
    ],
    camera: [
      '85mm or macro lens',
      'f/11 aperture',
      'razor-sharp focus edge to edge',
    ],
    reference: [
      'premium product page photography',
      'studio product shot on seamless white',
    ],
    negativeHints: [
      'colored background',
      'lifestyle scene',
      'dramatic shadows',
      'atmospheric haze',
      'environmental context',
      'dark tones',
    ],
    typography: {
      heading: 'sans',
      body: 'sans',
      weightH1: 500,
      weightBody: 400,
      tracking: 'tight',
    },
    layoutAffinity: {
      hero_app: 10,
      feature_grid: 8,
      story_ad: 3,
      minimal_branding: 7,
      ui_focus: 10,
    },
  },

  // ────────────────────────────────────────────────────────────
  // SOCIAL MEDIA AD
  // Instagram shoppable, TikTok-native, swipe-stopper energy
  // ────────────────────────────────────────────────────────────
  social_media_ad: {
    id: 'social_media_ad',
    displayName: 'Social Media Ad',
    lighting: [
      'bright clean even lighting',
      'energetic high-contrast key',
      'subject pop through luminance',
    ],
    composition: [
      'bold subject placement',
      'vertical-friendly framing with top text space',
      'immediate visual hook, eye-catching subject',
    ],
    palette: [
      'vibrant saturated colors',
      'high contrast complementary tones',
      'strong color blocks for visual impact',
    ],
    camera: [
      '35mm lens',
      'f/4 aperture',
      'sharp throughout, minor vignette',
    ],
    reference: [
      'direct-to-consumer social campaign',
      'performance advertising hero shot',
    ],
    negativeHints: [
      'moody tones',
      'slow pacing',
      'editorial subtlety',
      'black background',
      'desaturated',
      'gloomy atmosphere',
    ],
    typography: {
      heading: 'sans',
      body: 'sans',
      weightH1: 800,
      weightBody: 500,
      tracking: 'tight',
    },
    layoutAffinity: {
      hero_app: 7,
      feature_grid: 8,
      story_ad: 10,
      minimal_branding: 5,
      ui_focus: 6,
    },
  },

  // ────────────────────────────────────────────────────────────
  // LIFESTYLE PRODUCT
  // Real environments, human context, documentary feel
  // ────────────────────────────────────────────────────────────
  lifestyle_product: {
    id: 'lifestyle_product',
    displayName: 'Lifestyle Product',
    lighting: [
      'natural mixed lighting',
      'window light or golden hour warmth',
      'soft ambient fill preserving shadow detail',
    ],
    composition: [
      'product in real environment',
      'implied human presence through context',
      'wider shot showing scene around subject',
    ],
    palette: [
      'natural palette matching real-world light',
      'warm afternoon tones OR cool morning tones',
      'color from environment, not artificial',
    ],
    camera: [
      '35mm or 50mm lens',
      'f/2.8 aperture',
      'documentary depth of field',
    ],
    reference: [
      'lifestyle commercial photography',
      'contemporary store visual narrative',
    ],
    negativeHints: [
      'studio cyc',
      'obviously posed',
      'artificial backdrop',
      'sterile environment',
      'dramatic lighting',
      'cinematic color grade',
    ],
    typography: {
      heading: 'serif',
      body: 'sans',
      weightH1: 500,
      weightBody: 400,
      tracking: 'normal',
    },
    layoutAffinity: {
      hero_app: 5,
      feature_grid: 6,
      story_ad: 9,
      minimal_branding: 8,
      ui_focus: 3,
    },
  },

  // ────────────────────────────────────────────────────────────
  // MINIMAL SWISS
  // Dieter Rams, Muji, Swiss design books — precise rationalism
  // ────────────────────────────────────────────────────────────
  minimal_swiss: {
    id: 'minimal_swiss',
    displayName: 'Minimal Swiss',
    lighting: [
      'diffused even lighting',
      'flat neutral key, minimal shadows',
      'no dramatic highlights',
    ],
    composition: [
      'strict grid-based layout',
      'geometric precision, rule of halves or thirds',
      'dominant negative space, 50 to 60 percent empty',
    ],
    palette: [
      'limited palette, two colors maximum',
      'flat color blocks, no gradients',
      'typographic color discipline',
    ],
    camera: [
      '50mm lens',
      'f/8 aperture',
      'perfectly sharp geometric clarity',
    ],
    reference: [
      'Swiss design book aesthetic',
      'modernist product catalog',
    ],
    negativeHints: [
      'ornate details',
      'dramatic lighting',
      'cluttered composition',
      'vibrant colors',
      'lifestyle scene',
      'environmental context',
    ],
    typography: {
      heading: 'sans',
      body: 'sans',
      weightH1: 700,
      weightBody: 400,
      tracking: 'tight',
    },
    layoutAffinity: {
      hero_app: 6,
      feature_grid: 9,
      story_ad: 4,
      minimal_branding: 10,
      ui_focus: 9,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// STYLE ASSIGNMENT LOGIC
// ═══════════════════════════════════════════════════════════════════

/**
 * Assigns a DIFFERENT style to each variant in a campaign.
 * Ensures the 5 variants feel like different ads, not variations.
 *
 * Algorithm:
 * 1. For each variant, score each available style by layoutAffinity
 * 2. Boost scenario-preferred styles significantly
 * 3. Boost styles matching intensity
 * 4. Add random jitter to avoid always picking same style
 * 5. Pick the highest scoring style
 * 6. Remove that style from pool (no duplicates)
 *
 * Returns array of VisualStyle, one per variant index.
 */
export function assignDiverseStyles(
  layouts: string[],
  intensities: Array<'soft' | 'medium' | 'aggressive'>,
  preferredStylesPerVariant?: Array<VisualStyle[] | undefined>,
): VisualStyle[] {
  const pool: VisualStyle[] = [...ALL_STYLES];
  const result: VisualStyle[] = [];

  for (let i = 0; i < layouts.length; i++) {
    const layout = layouts[i] as keyof VisualStyleSpec['layoutAffinity'];
    const intensity = intensities[i];
    const preferred = preferredStylesPerVariant?.[i];

    // Score each remaining style for this variant
    const scored = pool.map((styleId) => {
      const spec = VISUAL_STYLES[styleId];
      let score = spec.layoutAffinity[layout] ?? 5;

      // Scenario preferred styles get strong boost (product intelligence)
      if (preferred && preferred.includes(styleId)) {
        score += 5;
      }

      // Intensity influence
      if (intensity === 'aggressive') {
        if (
          styleId === 'dark_cinematic' ||
          styleId === 'social_media_ad' ||
          styleId === 'bold_startup'
        ) {
          score += 2;
        }
      } else if (intensity === 'soft') {
        if (
          styleId === 'minimal_swiss' ||
          styleId === 'editorial_magazine' ||
          styleId === 'luxury_beige'
        ) {
          score += 2;
        }
      }

      // Random jitter
      score += Math.random() * 2;

      return { styleId, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const picked = scored[0].styleId;
    result.push(picked);
    pool.splice(pool.indexOf(picked), 1);

    if (pool.length === 0) pool.push(...ALL_STYLES);
  }

  return result;
}

/**
 * Sensible default when planner doesn't pick a style.
 * Unlike the old version, does NOT default to luxury/premium.
 */
export function pickDefaultStyleForLayout(
  layout: string,
  intensity: 'soft' | 'medium' | 'aggressive',
): VisualStyle {
  if (intensity === 'aggressive') {
    if (layout === 'story_ad') return 'dark_cinematic';
    return 'social_media_ad';
  }
  if (intensity === 'soft') {
    if (layout === 'minimal_branding') return 'luxury_beige';
    if (layout === 'ui_focus') return 'minimal_swiss';
    return 'editorial_magazine';
  }
  // medium
  if (layout === 'hero_app') return 'clean_bright';
  if (layout === 'feature_grid') return 'bold_startup';
  if (layout === 'story_ad') return 'lifestyle_product';
  if (layout === 'minimal_branding') return 'minimal_swiss';
  if (layout === 'ui_focus') return 'tech_product_white';
  return 'clean_bright';
}
