import 'server-only';
import { serverEnv } from '@/lib/env';
import type {
  ProductBrief,
  ImageAnalysis,
  Variant,
  AspectRatio,
  CampaignMemory,
  CampaignDirection,
} from '../types';
import { pickDefaultStyleForLayout } from '../data/visual-styles';

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
Previous variants:
${JSON.stringify(memory.previousVariants, null, 2)}
`
      : '';

  const directionBlock = direction
    ? `
ART DIRECTION:
${JSON.stringify(direction, null, 2)}
`
    : '';

  const prompt = `
You are a top creative director.

Generate exactly 5 ad variants.

STRICT RULES:
- No generic marketing phrases
- No fluff
- No "revolutionary", "next-gen"
- Keep it sharp and real
- Avoid empty black frames
- Every visualDirection must describe a visible premium scene
- Images will be generated WITHOUT TEXT, so describe scene only
- Reserve space for copy through composition, never by asking for a blank frame

OUTPUT JSON ONLY:
{ "variants": [...] }

Each variant must include:
- id
- layout
- angle
- intent
- visualDirection
- compositionHint
- copy { headline, subheadline, cta }

BRIEF:
${JSON.stringify(brief, null, 2)}

ANALYSES:
${JSON.stringify(analyses, null, 2)}

${directionBlock}

${memoryBlock}
`;

  try {
    const res = await claude.messages.create({
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      res.content[0]?.type === 'text' ? res.content[0].text : '';

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) throw new Error('No JSON from Claude');

    const parsed = JSON.parse(match[0]);

    if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      throw new Error('No variants array from Claude');
    }

    return parsed.variants.map((v: any) => normalize(v, aspectRatio));
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

    mood: v.mood || 'premium',
    palette: Array.isArray(v.palette)
      ? v.palette.slice(0, 5)
      : ['#0a0a0b', '#c9a863'],
    confidence: typeof v.confidence === 'number' ? v.confidence : 70,
    reasoningSummary: v.reasoningSummary || '',

    aspectRatio,
    visualDirection:
      v.visualDirection ||
      'Visible premium scene with controlled lighting, layered depth, and clear focal subject',
    compositionHint: v.compositionHint || 'Clear focal subject with clean reserved space',
    intensity,
    styleHint:
      v.styleHint || pickDefaultStyleForLayout(layout, intensity),
  };
}

function fallback(
  brief: ProductBrief,
  aspectRatio: AspectRatio,
): Variant[] {
  const isEs = brief.locale === 'es';

  return [
    {
      id: 'fallback-1',
      layout: 'hero_app',
      angle: 'result',
      intent: 'fallback hero result',
      engine: 'flux',
      copy: {
        headline: isEs ? 'Cinco anuncios. Una subida.' : 'Five ads. One upload.',
        subheadline: '',
        cta: '',
      },
      composition: {
        heroAssetIndex: undefined,
        supportAssetIndices: [],
        logoIndex: undefined,
        logoPosition: 'top-right',
        mockupType: 'none',
      },
      mood: 'premium',
      palette: ['#0a0a0b', '#c9a863'],
      confidence: 50,
      reasoningSummary: 'fallback',
      aspectRatio,
      visualDirection:
        'Visible premium hero scene with refined materials, controlled lighting, and clear depth separation',
      compositionHint:
        'Hero subject upper-middle with clean but still visible environment around it',
      intensity: 'medium',
      styleHint: 'minimal',
    },
    {
      id: 'fallback-2',
      layout: 'story_ad',
      angle: 'pain',
      intent: 'fallback pain',
      engine: 'flux',
      copy: {
        headline: isEs ? 'Deja de improvisar' : 'Stop guessing',
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
      mood: 'tense',
      palette: ['#0a0a0b', '#c9a863'],
      confidence: 50,
      reasoningSummary: 'fallback',
      aspectRatio,
      visualDirection:
        'Tense premium workspace scene with visible objects, directional light, and cinematic atmosphere',
      compositionHint:
        'Primary subject left-of-center with overlay-safe space to the right inside a visible scene',
      intensity: 'aggressive',
      styleHint: 'cinematic',
    },
    {
      id: 'fallback-3',
      layout: 'ui_focus',
      angle: 'authority',
      intent: 'fallback authority',
      engine: 'flux',
      copy: {
        headline: isEs ? 'Hecho para operadores' : 'Built for operators',
        subheadline: '',
        cta: '',
      },
      composition: {
        heroAssetIndex: undefined,
        supportAssetIndices: [],
        logoIndex: undefined,
        logoPosition: 'top-center',
        mockupType: 'none',
      },
      mood: 'quiet',
      palette: ['#0a0a0b', '#c9a863'],
      confidence: 50,
      reasoningSummary: 'fallback',
      aspectRatio,
      visualDirection:
        'Restrained premium scene with visible product presence, clean surface, and soft controlled light',
      compositionHint:
        'Centered subject with balanced breathing room and visible environmental detail',
      intensity: 'soft',
      styleHint: 'minimal',
    },
    {
      id: 'fallback-4',
      layout: 'minimal_branding',
      angle: 'curiosity',
      intent: 'fallback curiosity',
      engine: 'flux',
      copy: {
        headline: isEs ? 'La mayoría lo hace mal.' : 'Most brands get this wrong.',
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
      mood: 'curious',
      palette: ['#0a0a0b', '#c9a863'],
      confidence: 50,
      reasoningSummary: 'fallback',
      aspectRatio,
      visualDirection:
        'Luxury branded scene with visible material texture, directional light sweep, and premium shadow structure',
      compositionHint:
        'One anchor object or surface in frame with clean upper area for overlay',
      intensity: 'soft',
      styleHint: 'luxury',
    },
    {
      id: 'fallback-5',
      layout: 'feature_grid',
      angle: 'aggressive',
      intent: 'fallback features',
      engine: 'flux',
      copy: {
        headline: isEs
          ? 'Todo lo que necesita tu marca.'
          : 'Everything a brand needs.',
        subheadline: '',
        cta: isEs ? 'Ver funciones' : 'See features',
        bullets: isEs
          ? ['Crear', 'Automatizar', 'Publicar']
          : ['Create', 'Automate', 'Publish'],
      },
      composition: {
        heroAssetIndex: undefined,
        supportAssetIndices: [],
        logoIndex: undefined,
        logoPosition: 'top-right',
        mockupType: 'none',
      },
      mood: 'bold',
      palette: ['#0a0a0b', '#c9a863'],
      confidence: 50,
      reasoningSummary: 'fallback',
      aspectRatio,
      visualDirection:
        'Structured premium scene with visible horizontal rhythm, layered depth, and clear scene segmentation',
      compositionHint:
        'Upper band cleaner, middle zone structured, lower zone calmer for CTA within a visible scene',
      intensity: 'aggressive',
      styleHint: 'aggressive',
    },
  ];
}
