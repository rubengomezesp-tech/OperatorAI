import 'server-only';
import { serverEnv } from '@/lib/env';
import type {
  ProductBrief,
  ImageAnalysis,
  Variant,
  VariantLayout,
  VariantAngle,
  AspectRatio,
  CampaignIntent,
  Intensity,
  VisualStyle,
  CampaignDirection,
} from '../types';

import { pickDefaultStyleForLayout } from '../data/visual-styles';

const MODEL = 'claude-sonnet-4-5-20250929';

export async function planCampaign(
  brief: ProductBrief,
  analyses: ImageAnalysis[],
  aspectRatio: AspectRatio,
  direction?: CampaignDirection,
): Promise<Variant[]> {

  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  const claude = new Anthropic({
    apiKey: serverEnv.ANTHROPIC_API_KEY,
  });

  const prompt = `
You are a top creative director.

Generate 5 ad variants.

STRICT RULES:
- No generic marketing phrases
- No fluff
- No "revolutionary", "next-gen"
- Keep it sharp and real

OUTPUT JSON ONLY:
{ "variants": [...] }

Each variant:
- layout
- angle
- visualDirection (scene description)
- compositionHint
- copy { headline, subheadline, cta }

IMPORTANT:
Images will be generated WITHOUT TEXT.
So describe SCENE only.

BRIEF:
${JSON.stringify(brief)}
`;

  try {
    const res = await claude.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      res.content[0]?.type === 'text' ? res.content[0].text : '';

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) throw new Error('No JSON from Claude');

    const parsed = JSON.parse(match[0]);

    return parsed.variants.map((v: any) => normalize(v, aspectRatio));

  } catch (err) {
    console.error('[planner] error:', err);
    return fallback(brief, aspectRatio);
  }
}

function normalize(v: any, aspectRatio: AspectRatio): Variant {
  return {
    id: v.id || Math.random().toString(36).slice(2),
    layout: v.layout || 'hero_app',
    angle: v.angle || 'result',
    intent: v.intent || '',
    engine: 'flux',

    copy: {
      headline: v.copy?.headline || '',
      subheadline: v.copy?.subheadline || '',
      cta: v.copy?.cta || '',
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
    confidence: 70,
    reasoningSummary: '',

    aspectRatio,
    visualDirection: v.visualDirection || '',
    compositionHint: v.compositionHint || '',

    intensity: 'medium',
    styleHint: pickDefaultStyleForLayout('hero_app', 'medium'),
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
      intent: 'fallback',
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

      mood: 'clean',
      palette: ['#0a0a0b', '#c9a863'],
      confidence: 50,
      reasoningSummary: 'fallback',

      aspectRatio,
      visualDirection:
        'Minimal premium scene with controlled lighting and clean composition',
      compositionHint: 'center subject',

      intensity: 'medium',
      styleHint: 'minimal',
    },
  ];
}
