import 'server-only';
import { serverEnv } from '@/lib/env';
import type {
  ProductBrief,
  ImageAnalysis,
  Variant,
  AspectRatio,
  CampaignMemory,
  CampaignDirection,
  VisualStyle,
} from '../types';
import {
  assignDiverseStyles,
  pickDefaultStyleForLayout,
  VISUAL_STYLES,
} from '../data/visual-styles';

const MODEL = 'claude-sonnet-4-5-20250929';

export async function planCampaign(
  brief: ProductBrief,
  analyses: ImageAnalysis[],
  aspectRatio: AspectRatio,
  memory?: CampaignMemory,
  direction?: CampaignDirection,
): Promise<Variant[]> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  const claude = new Anthropic({
    apiKey: serverEnv.ANTHROPIC_API_KEY,
  });

  const memoryBlock =
    memory && memory.previousVariants?.length
      ? `
PREVIOUS ITERATION CONTEXT:
Rejected IDs: ${JSON.stringify(memory.rejectedVariantIds || [])}
Selected ID: ${JSON.stringify(memory.selectedVariantId || null)}
Regeneration count: ${memory.regenerationCount || 0}
Previous variants (avoid repeating their visual direction):
${JSON.stringify(memory.previousVariants.map((v) => ({
  layout: v.layout,
  angle: v.angle,
  styleHint: v.styleHint,
  visualDirection: v.visualDirection?.slice(0, 120),
})), null, 2)}
`
      : '';

  const directionBlock = direction
    ? `
ART DIRECTION:
${JSON.stringify(direction, null, 2)}
`
    : '';

  const prompt = `
You are a senior creative director at a top advertising agency.

Your job: generate 5 ad variants that feel like ads from 5 DIFFERENT brands.

Each variant must have its own visual world. Not 5 variations of the same idea.

═══════════════════════════════
VISUAL DIVERSITY RULES
═══════════════════════════════

- Avoid defaulting to "dark premium" or "black and gold" aesthetic
- Do NOT over-use luxury tropes
- Each variant must feel visually distinct
- Use realistic photography/advertising language, not generic marketing phrases
- Include concrete scene elements: materials, surfaces, lighting, subject placement
- Reserve space for overlay text through composition, NEVER through empty/blank frames

═══════════════════════════════
COPY RULES
═══════════════════════════════

- No generic marketing phrases
- No "revolutionary", "next-gen", "game-changing"
- Sharp, specific, real
- Copy tone matches the visual direction

═══════════════════════════════
VISUAL DIRECTION FIELD (visualDirection)
═══════════════════════════════

Must describe a concrete visible scene including:
- Subject and its physical context
- Lighting character (natural/studio/directional/soft)
- Key materials or surfaces
- Mood through sensory detail

Examples of GOOD visualDirection:
- "iPhone floating above a brushed aluminum surface in soft daylight, shallow depth of field, minimal shadow, bright clean atmosphere"
- "Young woman holding coffee in a sunlit window kitchen, golden hour warmth on her face, warm beige tones, editorial framing"
- "Product centered on pure white cyclorama with overhead soft light, no shadows, precision studio shot"

Examples of BAD visualDirection (too generic):
- "Premium scene with controlled lighting"
- "Dark cinematic mood"
- "Luxury atmosphere with gold accents"

═══════════════════════════════
OUTPUT (JSON ONLY)
═══════════════════════════════

{ "variants": [
  {
    "id": "...",
    "layout": "hero_app" | "feature_grid" | "story_ad" | "minimal_branding" | "ui_focus",
    "angle": "pain" | "result" | "authority" | "curiosity" | "aggressive",
    "intent": "...",
    "visualDirection": "...concrete scene description...",
    "compositionHint": "...where subject sits, where text goes...",
    "intensity": "soft" | "medium" | "aggressive",
    "mood": "...one word mood...",
    "palette": ["#hex", "#hex"],
    "copy": { "headline": "...", "subheadline": "...", "cta": "..." }
  }
  // x 5 total
] }

═══════════════════════════════
BRIEF
═══════════════════════════════
${JSON.stringify(brief, null, 2)}

═══════════════════════════════
IMAGE ANALYSES (reference material)
═══════════════════════════════
${JSON.stringify(analyses, null, 2)}

${directionBlock}

${memoryBlock}
`;

  try {
    const res = await claude.messages.create({
      model: MODEL,
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON from Claude');

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      throw new Error('No variants array from Claude');
    }

    const normalized = parsed.variants.map((v: any) => normalize(v, aspectRatio));

    // ── DIVERSITY PASS ───────────────────────────────────────
    // Assign a DIFFERENT visual style to each variant.
    // Overrides whatever styleHint came from Claude (if any) to guarantee diversity.
    const layouts = normalized.map((v: Variant) => v.layout);
    const intensities = normalized.map((v: Variant) => v.intensity);
    const assignedStyles = assignDiverseStyles(layouts, intensities);

    for (let i = 0; i < normalized.length; i++) {
      normalized[i].styleHint = assignedStyles[i];
    }

    return normalized;
  } catch (err) {
    console.error('[planner] error:', err);
    return fallback(brief, aspectRatio);
  }
}

function normalize(v: any, aspectRatio: AspectRatio): Variant {
  const layout = v.layout || 'hero_app';
  const intensity = v.intensity || 'medium';

  return {
    id: v.id || Math.random().toString(36).slice(2),
    layout,
    angle: v.angle || 'result',
    intent: v.intent || '',
    engine: 'flux',

    copy: {
      headline: v.copy?.headline || '',
      subheadline: v.copy?.subheadline || '',
      cta: v.copy?.cta || '',
      bullets: Array.isArray(v.copy?.bullets)
        ? v.copy.bullets.slice(0, 3)
        : undefined,
    },

    composition: {
      heroAssetIndex: v.composition?.heroAssetIndex ?? undefined,
      supportAssetIndices: Array.isArray(v.composition?.supportAssetIndices)
        ? v.composition.supportAssetIndices.slice(0, 3)
        : [],
      logoIndex: v.composition?.logoIndex ?? undefined,
      logoPosition: v.composition?.logoPosition || 'top-right',
      mockupType: v.composition?.mockupType || 'none',
    },

    mood: v.mood || 'confident',
    palette: Array.isArray(v.palette) && v.palette.length > 0
      ? v.palette.slice(0, 5)
      : [],
    confidence: typeof v.confidence === 'number' ? v.confidence : 70,
    reasoningSummary: v.reasoningSummary || '',

    aspectRatio,
    visualDirection:
      v.visualDirection ||
      'Clear focal subject in a visible environment with considered lighting and composition',
    compositionHint:
      v.compositionHint || 'Subject off-center with reserved space for overlay text',
    intensity,
    // styleHint temporarily set; diversity pass will override
    styleHint:
      (v.styleHint as VisualStyle) || pickDefaultStyleForLayout(layout, intensity),
  };
}

// ═══════════════════════════════════════════════════════════════════
// FALLBACK VARIANTS — each uses a DIFFERENT style (no "premium/gold" bias)
// ═══════════════════════════════════════════════════════════════════

function fallback(brief: ProductBrief, aspectRatio: AspectRatio): Variant[] {
  const isEs = brief.locale === 'es';
  const palette = brief.palette && brief.palette.length > 0
    ? brief.palette
    : ['#1a1a1a', '#f5f5f5'];

  return [
    {
      id: 'fallback-1',
      layout: 'hero_app',
      angle: 'result',
      intent: 'fallback clean product hero',
      engine: 'flux',
      copy: {
        headline: isEs ? 'La forma más simple.' : 'The simplest way.',
        subheadline: isEs ? 'Creado para funcionar.' : 'Built to just work.',
        cta: isEs ? 'Probar' : 'Try it',
      },
      composition: {
        heroAssetIndex: undefined,
        supportAssetIndices: [],
        logoIndex: undefined,
        logoPosition: 'top-center',
        mockupType: 'none',
      },
      mood: 'fresh',
      palette,
      confidence: 50,
      reasoningSummary: 'fallback clean bright product hero',
      aspectRatio,
      visualDirection:
        'Product centered on pure white cyclorama, overhead soft lighting with subtle floor shadow, bright clean atmosphere, studio product shot',
      compositionHint:
        'Product centered vertically, upper third reserved for headline, ample whitespace',
      intensity: 'medium',
      styleHint: 'tech_product_white',
    },
    {
      id: 'fallback-2',
      layout: 'story_ad',
      angle: 'pain',
      intent: 'fallback lifestyle tension',
      engine: 'flux',
      copy: {
        headline: isEs ? 'Algo tenía que cambiar.' : 'Something had to change.',
        subheadline: '',
        cta: isEs ? 'Descubrir' : 'See more',
      },
      composition: {
        heroAssetIndex: undefined,
        supportAssetIndices: [],
        logoIndex: undefined,
        logoPosition: 'bottom-center',
        mockupType: 'none',
      },
      mood: 'tense',
      palette,
      confidence: 50,
      reasoningSummary: 'fallback dark cinematic story',
      aspectRatio,
      visualDirection:
        'Subject in moody interior with single directional light from window, atmospheric haze, desaturated color grade with amber accent, off-center composition with deep shadows retaining detail',
      compositionHint:
        'Subject lower-left third, right side reserved for overlay copy, negative space in upper area',
      intensity: 'aggressive',
      styleHint: 'dark_cinematic',
    },
    {
      id: 'fallback-3',
      layout: 'ui_focus',
      angle: 'authority',
      intent: 'fallback minimalist authority',
      engine: 'flux',
      copy: {
        headline: isEs ? 'Construido con precisión.' : 'Built with precision.',
        subheadline: '',
        cta: '',
      },
      composition: {
        heroAssetIndex: undefined,
        supportAssetIndices: [],
        logoIndex: undefined,
        logoPosition: 'top-left',
        mockupType: 'none',
      },
      mood: 'confident',
      palette,
      confidence: 50,
      reasoningSummary: 'fallback swiss minimal',
      aspectRatio,
      visualDirection:
        'Single geometric object on flat neutral surface, diffused even lighting, minimal shadows, two-color palette, grid-based composition with dominant negative space',
      compositionHint:
        'Subject in lower-right quadrant following rule of thirds, dominant negative space 60 percent of frame',
      intensity: 'soft',
      styleHint: 'minimal_swiss',
    },
    {
      id: 'fallback-4',
      layout: 'minimal_branding',
      angle: 'curiosity',
      intent: 'fallback warm luxury',
      engine: 'flux',
      copy: {
        headline: isEs ? 'Hecho con cuidado.' : 'Made with care.',
        subheadline: '',
        cta: '',
      },
      composition: {
        heroAssetIndex: undefined,
        supportAssetIndices: [],
        logoIndex: undefined,
        logoPosition: 'bottom-center',
        mockupType: 'none',
      },
      mood: 'refined',
      palette,
      confidence: 50,
      reasoningSummary: 'fallback luxury beige warm',
      aspectRatio,
      visualDirection:
        'Object resting on linen-textured surface in warm window light, cream and beige tones throughout, soft amber shadows, refined editorial placement with breathing room',
      compositionHint:
        'Subject in upper-center third, lower half empty beige surface for overlay text',
      intensity: 'soft',
      styleHint: 'luxury_beige',
    },
    {
      id: 'fallback-5',
      layout: 'feature_grid',
      angle: 'aggressive',
      intent: 'fallback bold startup',
      engine: 'flux',
      copy: {
        headline: isEs ? 'Todo en uno.' : 'Everything in one place.',
        subheadline: isEs ? 'Más rápido.' : 'Faster.',
        cta: isEs ? 'Ver más' : 'See more',
        bullets: isEs ? ['Crear', 'Automatizar', 'Publicar'] : ['Create', 'Automate', 'Ship'],
      },
      composition: {
        heroAssetIndex: undefined,
        supportAssetIndices: [],
        logoIndex: undefined,
        logoPosition: 'top-right',
        mockupType: 'none',
      },
      mood: 'energetic',
      palette,
      confidence: 50,
      reasoningSummary: 'fallback bold startup saas hero',
      aspectRatio,
      visualDirection:
        'Product hero on gradient backdrop with subtle color glow, floating UI elements suggesting depth, clean studio lighting, one dominant vibrant brand color with complementary accent',
      compositionHint:
        'Product anchored center with geometric accents around, headline space reserved upper portion',
      intensity: 'medium',
      styleHint: 'bold_startup',
    },
  ];
}
