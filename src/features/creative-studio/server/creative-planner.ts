import 'server-only';
import { serverEnv } from '@/lib/env';
import type {
  ProductBrief,
  ImageAnalysis,
  Variant,
  VariantLayout,
  RenderEngine,
  AspectRatio,
  CampaignMemory,
  CampaignIntent,
  VariantAngle,
} from '../types';
import { hasQualityInputs } from './hero-scoring';

const PLANNER_MODEL = 'claude-sonnet-4-5-20250929';

const REQUIRED_LAYOUTS: VariantLayout[] = [
  'hero_app',
  'feature_grid',
  'story_ad',
  'minimal_branding',
  'ui_focus',
];

const LAYOUT_TO_ANGLE: Record<VariantLayout, VariantAngle> = {
  hero_app: 'capability',
  feature_grid: 'breadth',
  story_ad: 'offer',
  minimal_branding: 'identity',
  ui_focus: 'proof',
};

/**
 * LAYER 3 — CREATIVE PLANNING
 * Generates 5 variants, each with a FIXED angle and layout.
 * Memory-aware: rejected variants and user edits shape regeneration.
 */
export async function planCampaign(
  brief: ProductBrief,
  analyses: ImageAnalysis[],
  aspectRatio: AspectRatio,
  memory?: CampaignMemory,
): Promise<Variant[]> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

  const quality = hasQualityInputs(analyses);
  const logoIdx = analyses.find((a) => a.role === 'logo')?.index;
  const heroIdx =
    analyses.find((a) => a.role === 'hero')?.index ?? analyses[0]?.index;
  const featureIdxs = analyses
    .filter((a) => a.role === 'feature')
    .map((a) => a.index);
  const supportIdxs = analyses
    .filter((a) => a.role === 'support')
    .map((a) => a.index);

  const prompt = buildPlannerPrompt({
    brief,
    logoIdx,
    heroIdx,
    featureIdxs,
    supportIdxs,
    quality,
    memory,
  });

  let variants: Variant[] = [];
  try {
    const res = await claude.messages.create({
      model: PLANNER_MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed.variants)) {
        variants = parsed.variants.map((v: any) =>
          normalizeVariant(v, aspectRatio),
        );
      }
    }
  } catch (err) {
    console.error('[creative-planner] error:', err);
  }

  if (!validateVariants(variants)) {
    console.warn('[creative-planner] Validation failed, using deterministic fallback');
    variants = buildFallbackVariants(
      brief,
      heroIdx,
      logoIdx,
      featureIdxs,
      supportIdxs,
      aspectRatio,
    );
  }

  // Override CTA deterministically based on variant x intent
  variants = variants.map((v) => ({
    ...v,
    copy: { ...v.copy, cta: computeCTA(v, brief) },
  }));

  return variants;
}

function buildPlannerPrompt(ctx: {
  brief: ProductBrief;
  logoIdx?: number;
  heroIdx?: number;
  featureIdxs: number[];
  supportIdxs: number[];
  quality: ReturnType<typeof hasQualityInputs>;
  memory?: CampaignMemory;
}): string {
  const { brief, logoIdx, heroIdx, featureIdxs, supportIdxs, quality, memory } = ctx;

  const langNote =
    brief.locale === 'es'
      ? 'ALL copy in NATURAL SPANISH. Use tuteo. Natural phrasing, not literal translations. Use correct Spanish spelling with n-tilde where appropriate.'
      : 'ALL copy in ENGLISH. Write like Apple 2024.';

  const intentGuide: Record<CampaignIntent, string> = {
    launch:
      'LAUNCH campaign. Copy has announcement energy. CTA is discovery-oriented.',
    conversion:
      'CONVERSION campaign. Copy has clear value plus incentive. CTA is aggressive with specific offer.',
    branding:
      'BRANDING campaign. Copy is identity and aspiration. CTA is soft or optional.',
    retargeting:
      'RETARGETING campaign. Copy says "you saw this" or "come back". CTA is return-oriented.',
  };

  let memoryContext = '';
  if (memory && memory.previousVariants.length > 0) {
    const rejected = memory.previousVariants.filter((v) =>
      memory.rejectedVariantIds.includes(v.id),
    );
    const selected = memory.previousVariants.find(
      (v) => v.id === memory.selectedVariantId,
    );

    const memoryLines = [
      '',
      'PREVIOUS GENERATION CONTEXT (iteration ' +
        (memory.regenerationCount + 1) +
        '):',
    ];
    if (rejected.length > 0) {
      memoryLines.push(
        'User REJECTED these (avoid same angle and copy):',
        ...rejected.map(
          (v) => '- ' + v.layout + ': "' + v.copy.headline + '" (' + v.angle + ')',
        ),
      );
    }
    if (selected) {
      memoryLines.push(
        'User LIKED: "' +
          selected.copy.headline +
          '" (' +
          selected.layout +
          '). Keep similar energy but do not copy verbatim.',
      );
    }
    memoryLines.push('Generate variants that EVOLVE from this feedback.');
    memoryContext = memoryLines.join('\n');
  }

  return [
    'You are a creative director at a premium agency.',
    '',
    langNote,
    intentGuide[brief.campaignIntent],
    '',
    'BRIEF:',
    JSON.stringify(brief, null, 2),
    '',
    'AVAILABLE ASSETS (by 1-based index):',
    '- Logo: ' + (logoIdx || 'none'),
    '- Hero: ' + (heroIdx || 'none'),
    '- Features: ' + JSON.stringify(featureIdxs),
    '- Support: ' + JSON.stringify(supportIdxs),
    '',
    'Quality check:',
    '- Has logo: ' + quality.hasLogo,
    '- Hero score: ' + quality.heroScore,
    '- Can do full 5-variant plan: ' + quality.canDoFullPlan,
    memoryContext,
    '',
    'Generate EXACTLY 5 variants. Each has a FIXED angle. Do NOT change the angle.',
    '',
    'VARIANT 1: hero_app',
    '  angle: "capability"  - What the product DOES. Main screenshot in iPhone mockup.',
    '  copy density: LOW (headline + subheadline + CTA)',
    '  engine: canvas if hero score >= 40, else hybrid',
    '',
    'VARIANT 2: feature_grid',
    '  angle: "breadth"  - ALL the tools. 3 features shown as labeled grid.',
    '  copy density: MEDIUM (headline + 3 bullets + CTA)',
    '  engine: canvas (always)',
    '  REQUIRE bullets array with 3 short feature names',
    '',
    'VARIANT 3: story_ad',
    '  angle: "offer"  - Urgency, trial, price. Aggressive.',
    '  copy density: LOW but BIG (huge headline + strong CTA)',
    '  engine: hybrid',
    '',
    'VARIANT 4: minimal_branding',
    '  angle: "identity"  - Who it is for. Quiet confidence.',
    '  copy density: MINIMAL (one sentence + tiny logo)',
    '  engine: flux if no strong logo needs placement, else canvas',
    '',
    'VARIANT 5: ui_focus',
    '  angle: "proof"  - Let the UI speak. Copy tiny or absent.',
    '  copy density: NONE or MINIMAL',
    '  engine: canvas',
    '',
    'FOR EACH variant return:',
    '- id: short slug (e.g. "hero-app-v1")',
    '- layout: one of the 5 above',
    '- angle: match layout mapping above',
    '- intent: 1 sentence why this variant exists',
    '- engine: "canvas" | "flux" | "hybrid"',
    '- copy.headline: max 6 words, specific, premium',
    '- copy.subheadline: max 12 words, concrete benefit (or empty string)',
    '- copy.cta: 2-4 words (or empty string for minimal/ui_focus)',
    '- copy.bullets: 3 items ONLY for feature_grid',
    '- composition.heroAssetIndex: asset to feature',
    '- composition.supportAssetIndices: array of 0-3 indices',
    '- composition.logoIndex: ' + (logoIdx ?? 'null'),
    '- composition.logoPosition: "top-left" | "top-right" | "top-center" | "bottom-center"',
    '- composition.mockupType: "iphone" (hero_app only) | "none"',
    '- mood: 2-3 words',
    '- palette: 3-5 hex colors from brief.palette',
    '- confidence: 0-100',
    '- reasoningSummary: 15 words explaining why this variant exists for THIS product and intent',
    '- renderPrompt: (optional) short art-direction phrase for flux/hybrid variants only',
    '',
    'ANTI-REPETITION RULES (hard):',
    '- NO two variants share the same headline (not even similar)',
    '- NO two variants share the same logoPosition',
    '- Only hero_app may use mockupType "iphone"',
    '- Bullets ONLY exist on feature_grid',
    '',
    'FORBIDDEN copy phrases:',
    'Revolutionize, Transform your, Unleash, Empower, Next-gen, Game-changing, Cutting-edge, Seamless, Leverage, Synergy, Revolucionar, Transformar tu, Potenciar.',
    '',
    'Respond ONLY with JSON: { "variants": [ 5 items ] }',
  ].join('\n');
}

function normalizeVariant(raw: any, aspectRatio: AspectRatio): Variant {
  const layout = (raw.layout || 'hero_app') as VariantLayout;
  return {
    id: raw.id || layout + '-' + Math.random().toString(36).slice(2, 8),
    layout,
    angle: LAYOUT_TO_ANGLE[layout],
    intent: raw.intent || '',
    engine: (raw.engine || 'canvas') as RenderEngine,
    copy: {
      headline: raw.copy?.headline || '',
      subheadline: raw.copy?.subheadline || '',
      cta: raw.copy?.cta || '',
      bullets: Array.isArray(raw.copy?.bullets)
        ? raw.copy.bullets.slice(0, 3)
        : undefined,
    },
    composition: {
      heroAssetIndex: raw.composition?.heroAssetIndex,
      supportAssetIndices: Array.isArray(raw.composition?.supportAssetIndices)
        ? raw.composition.supportAssetIndices.slice(0, 3)
        : [],
      logoIndex: raw.composition?.logoIndex ?? undefined,
      logoPosition: raw.composition?.logoPosition || 'top-right',
      mockupType: raw.composition?.mockupType || 'none',
    },
    mood: raw.mood || 'premium',
    palette: Array.isArray(raw.palette)
      ? raw.palette.slice(0, 5)
      : ['#0a0a0b', '#c9a863'],
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 60,
    reasoningSummary: raw.reasoningSummary || '',
    aspectRatio,
    renderPrompt: raw.renderPrompt,
  };
}

function validateVariants(variants: Variant[]): boolean {
  if (variants.length !== 5) return false;
  for (const layout of REQUIRED_LAYOUTS) {
    if (!variants.find((v) => v.layout === layout)) return false;
  }
  const headlines = variants
    .map((v) => v.copy.headline.toLowerCase().trim())
    .filter(Boolean);
  const positions = variants.map((v) => v.composition.logoPosition);

  const iphoneCount = variants.filter(
    (v) => v.composition.mockupType === 'iphone',
  ).length;
  if (iphoneCount > 1) return false;

  if (new Set(headlines).size !== headlines.length) return false;
  if (new Set(positions).size < 3) return false;

  return true;
}

function computeCTA(variant: Variant, brief: ProductBrief): string {
  const isEs = brief.locale === 'es';

  if (variant.layout === 'minimal_branding' && brief.campaignIntent === 'branding') {
    return '';
  }
  if (variant.layout === 'ui_focus') return '';

  if (variant.layout === 'story_ad') {
    const ctas: Record<CampaignIntent, { en: string; es: string }> = {
      launch: { en: 'Discover it', es: 'Descubrelo' },
      conversion: { en: '7 days free', es: '7 dias gratis' },
      branding: { en: 'Explore', es: 'Descubrir' },
      retargeting: {
        en: 'Pick up where you left',
        es: 'Sigue donde lo dejaste',
      },
    };
    return ctas[brief.campaignIntent][isEs ? 'es' : 'en'];
  }

  return variant.copy.cta || brief.suggestedCTA;
}

function buildFallbackVariants(
  brief: ProductBrief,
  heroIdx: number | undefined,
  logoIdx: number | undefined,
  featureIdxs: number[],
  supportIdxs: number[],
  aspectRatio: AspectRatio,
): Variant[] {
  const isEs = brief.locale === 'es';
  const baseComposition = {
    supportAssetIndices: supportIdxs.slice(0, 3),
    logoIndex: logoIdx,
  };

  return [
    {
      id: 'hero-app-fb',
      layout: 'hero_app',
      angle: 'capability',
      intent: brief.oneLiner,
      engine: 'canvas' as RenderEngine,
      copy: {
        headline: isEs ? 'Tu marca. Lista.' : 'Your brand. Ready.',
        subheadline: brief.oneLiner,
        cta: brief.suggestedCTA,
      },
      composition: {
        ...baseComposition,
        heroAssetIndex: heroIdx,
        logoPosition: 'top-right',
        mockupType: 'iphone',
      },
      mood: 'premium confident',
      palette: brief.palette,
      confidence: 70,
      reasoningSummary: 'Hero app mockup showing main capability',
      aspectRatio,
    },
    {
      id: 'feature-grid-fb',
      layout: 'feature_grid',
      angle: 'breadth',
      intent: 'Show feature breadth',
      engine: 'canvas' as RenderEngine,
      copy: {
        headline: isEs ? 'Todo en un sistema' : 'All in one system',
        subheadline: '',
        cta: isEs ? 'Ver funciones' : 'See features',
        bullets:
          brief.features.length >= 3
            ? brief.features.slice(0, 3)
            : [
                isEs ? 'Crear' : 'Create',
                isEs ? 'Automatizar' : 'Automate',
                isEs ? 'Publicar' : 'Publish',
              ],
      },
      composition: {
        ...baseComposition,
        heroAssetIndex: heroIdx,
        logoPosition: 'top-center',
        mockupType: 'none',
      },
      mood: 'structured clear',
      palette: brief.palette,
      confidence: 65,
      reasoningSummary: 'Features grid for breadth communication',
      aspectRatio,
    },
    {
      id: 'story-ad-fb',
      layout: 'story_ad',
      angle: 'offer',
      intent: 'Drive conversion with urgency',
      engine: 'hybrid' as RenderEngine,
      copy: {
        headline: isEs ? 'Empieza ahora' : 'Start now',
        subheadline: brief.valueProposition,
        cta: '',
      },
      composition: {
        ...baseComposition,
        heroAssetIndex: heroIdx,
        logoPosition: 'top-left',
        mockupType: 'none',
      },
      mood: 'bold urgent',
      palette: brief.palette,
      confidence: 70,
      reasoningSummary: 'Story ad with strong offer',
      aspectRatio,
    },
    {
      id: 'minimal-fb',
      layout: 'minimal_branding',
      angle: 'identity',
      intent: 'Brand identity statement',
      engine: 'canvas' as RenderEngine,
      copy: {
        headline: isEs ? 'Para marcas que ejecutan' : 'For brands that execute',
        subheadline: '',
        cta: '',
      },
      composition: {
        ...baseComposition,
        heroAssetIndex: undefined,
        logoPosition: 'bottom-center',
        mockupType: 'none',
      },
      mood: 'quiet premium',
      palette: brief.palette,
      confidence: 60,
      reasoningSummary: 'Minimal identity-focused variant',
      aspectRatio,
    },
    {
      id: 'ui-focus-fb',
      layout: 'ui_focus',
      angle: 'proof',
      intent: 'Let the product speak',
      engine: 'canvas' as RenderEngine,
      copy: { headline: '', subheadline: '', cta: '' },
      composition: {
        ...baseComposition,
        heroAssetIndex: heroIdx,
        logoPosition: 'top-center',
        mockupType: 'none',
      },
      mood: 'product-first',
      palette: brief.palette,
      confidence: 65,
      reasoningSummary: 'UI takes center stage, minimal text',
      aspectRatio,
    },
  ];
}
