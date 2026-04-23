import 'server-only';
import { serverEnv } from '@/lib/env';
import type {
  ProductBrief,
  ImageAnalysis,
  Variant,
  VariantLayout,
  VariantAngle,
  RenderEngine,
  AspectRatio,
  CampaignMemory,
  CampaignIntent,
  Intensity,
  VisualStyle,
} from '../types';
import { hasQualityInputs } from './hero-scoring';
import { pickDefaultStyleForLayout } from '../data/visual-styles';

const PLANNER_MODEL = 'claude-sonnet-4-5-20250929';

// Mapping: layout -> mandatory angle
const LAYOUT_ANGLE_MAP: Record<VariantLayout, VariantAngle> = {
  story_ad: 'pain',
  hero_app: 'result',
  ui_focus: 'authority',
  minimal_branding: 'curiosity',
  feature_grid: 'aggressive',
};

const REQUIRED_LAYOUTS: VariantLayout[] = [
  'hero_app',
  'feature_grid',
  'story_ad',
  'minimal_branding',
  'ui_focus',
];

// Default intensity per layout (fallback)
const LAYOUT_INTENSITY: Record<VariantLayout, Intensity> = {
  hero_app: 'medium',
  feature_grid: 'aggressive',
  story_ad: 'aggressive',
  minimal_branding: 'soft',
  ui_focus: 'soft',
};

/**
 * LAYER 3 — CREATIVE PLANNING v4A
 * - 5 fixed angles (pain / result / authority / curiosity / aggressive)
 * - Each variant gets visualDirection, compositionHint, intensity, styleHint
 * - Memory-aware regeneration
 * - Strict copy rules (Apple-grade, no HubSpot slop)
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
      max_tokens: 5000,
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

  // Post-process: ensure angle + intensity + styleHint + CTA are coherent
  variants = variants.map((v) => {
    const angle = LAYOUT_ANGLE_MAP[v.layout] || v.angle;
    const intensity = v.intensity || LAYOUT_INTENSITY[v.layout] || 'medium';
    const styleHint = v.styleHint || pickDefaultStyleForLayout(v.layout, intensity);
    return {
      ...v,
      angle,
      intensity,
      styleHint,
      copy: { ...v.copy, cta: computeCTA(v, brief, angle) },
    };
  });

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
      ? 'ALL copy in NATURAL SPANISH. Use tuteo. Natural phrasing. Use correct Spanish spelling with n-tilde (campanas -> should render as campanas with proper n-tilde; e.g. write it correctly as campañas, años, diseño).'
      : 'ALL copy in ENGLISH. Write like Apple 2024 product pages, or Linear marketing. Not HubSpot.';

  const intentGuide: Record<CampaignIntent, string> = {
    launch:
      'LAUNCH campaign: announcement energy. Emphasis on novelty and capability.',
    conversion:
      'CONVERSION campaign: clear value + incentive. CTA aggressive with specific offer.',
    branding:
      'BRANDING campaign: identity and aspiration. CTA soft or omitted.',
    retargeting:
      'RETARGETING campaign: "you saw this" / "come back". CTA return-oriented.',
  };

  let memoryContext = '';
  if (memory && memory.previousVariants.length > 0) {
    const rejected = memory.previousVariants.filter((v) =>
      memory.rejectedVariantIds.includes(v.id),
    );
    const selected = memory.previousVariants.find(
      (v) => v.id === memory.selectedVariantId,
    );

    const lines = [
      '',
      'PREVIOUS ITERATION (count ' + (memory.regenerationCount + 1) + '):',
    ];
    if (rejected.length > 0) {
      lines.push('User REJECTED (do not repeat angle nor copy):');
      rejected.forEach((v) =>
        lines.push('- ' + v.layout + ': "' + v.copy.headline + '" (' + v.angle + ')'),
      );
    }
    if (selected) {
      lines.push(
        'User LIKED: "' + selected.copy.headline + '" (' + selected.layout + '). Keep similar energy, new phrasing.',
      );
    }
    memoryContext = lines.join('\n');
  }

  return [
    'You are a creative director at a premium agency. Output must feel like real high-end ads, not AI slop.',
    '',
    langNote,
    intentGuide[brief.campaignIntent],
    '',
    'BRIEF:',
    JSON.stringify(brief, null, 2),
    '',
    'AVAILABLE ASSETS (1-based index):',
    '- Logo: ' + (logoIdx || 'none'),
    '- Hero: ' + (heroIdx || 'none'),
    '- Features: ' + JSON.stringify(featureIdxs),
    '- Support: ' + JSON.stringify(supportIdxs),
    '',
    'Quality:',
    '- Has logo: ' + quality.hasLogo,
    '- Hero score: ' + quality.heroScore,
    memoryContext,
    '',
    'GENERATE EXACTLY 5 VARIANTS. Each has a FIXED angle + layout.',
    '',
    'VARIANT 1 — story_ad (angle: pain)',
    '  Lead with a real tension or problem the user feels.',
    '  Headline sharp and direct. NO soft philosophy.',
    '  Example headlines EN: "Stop guessing content", "Your ads are invisible", "Tired of blank pages?"',
    '  Example headlines ES: "Deja de improvisar", "Tus anuncios no convierten", "Cansado de empezar de cero"',
    '  copy density: LOW but LOUD. Big headline. Strong CTA.',
    '  intensity: aggressive.',
    '',
    'VARIANT 2 — hero_app (angle: result)',
    '  Lead with the tangible outcome. Specific, concrete.',
    '  Show the product doing its job (iPhone mockup).',
    '  Example EN: "From idea to ad in 60 seconds", "Five ads. One upload."',
    '  Example ES: "De idea a anuncio en 60 segundos", "Cinco anuncios. Una subida."',
    '  copy density: LOW (headline + subheadline + CTA).',
    '  intensity: medium.',
    '',
    'VARIANT 3 — ui_focus (angle: authority)',
    '  Let the product speak. Minimal copy, strong UI presence.',
    '  Headline optional; if present, it positions credibility.',
    '  Example EN: "Built for operators", "The brand system behind serious teams"',
    '  Example ES: "Hecho para operadores", "El sistema detras de equipos serios"',
    '  copy density: MINIMAL. intensity: soft.',
    '',
    'VARIANT 4 — minimal_branding (angle: curiosity)',
    '  Open a loop. Create tension without giving the full answer.',
    '  Must feel intentional, not empty. Use one short sentence + small logo.',
    '  Example EN: "Most brands get this wrong.", "What if ads built themselves?"',
    '  Example ES: "La mayoria lo hace mal.", "Y si los anuncios se hicieran solos?"',
    '  copy density: MINIMAL. intensity: soft. MUST feel tense, not blank.',
    '',
    'VARIANT 5 — feature_grid (angle: aggressive)',
    '  Lead with breadth + punch. 3 clear features as proof.',
    '  Grid stays clean; copy headline is punchy but not noisy.',
    '  Example EN: "Everything a brand needs. In one place."',
    '  Example ES: "Todo lo que necesita tu marca. En un solo sitio."',
    '  copy density: MEDIUM (headline + 3 bullets + CTA). intensity: aggressive.',
    '  BULLETS: exactly 3. Short (2-4 words each). Parallel structure.',
    '',
    'FOR EACH VARIANT return:',
    '{',
    '  "id": "short-slug",',
    '  "layout": "hero_app" | "feature_grid" | "story_ad" | "minimal_branding" | "ui_focus",',
    '  "angle": "pain" | "result" | "authority" | "curiosity" | "aggressive",',
    '  "intent": "1 sentence why this variant exists",',
    '  "engine": "canvas" | "flux" | "hybrid",',
    '  "intensity": "soft" | "medium" | "aggressive",',
    '  "styleHint": "luxury" | "minimal" | "startup" | "aggressive" | "cinematic",',
    '  "visualDirection": "2-3 sentences describing scene, light, depth, mood. Specific and cinematic.",',
    '  "compositionHint": "1 sentence describing layout: where hero goes, where text goes, negative space",',
    '  "copy": {',
    '    "headline": "max 6 words, specific, punchy",',
    '    "subheadline": "max 12 words, concrete benefit or empty",',
    '    "cta": "2-4 words or empty",',
    '    "bullets": ["item","item","item"] (only for feature_grid)',
    '  },',
    '  "composition": {',
    '    "heroAssetIndex": number or null,',
    '    "supportAssetIndices": [0-3 indices],',
    '    "logoIndex": ' + (logoIdx ?? 'null') + ',',
    '    "logoPosition": "top-left" | "top-right" | "top-center" | "bottom-center",',
    '    "mockupType": "iphone" (hero_app only) | "none"',
    '  },',
    '  "mood": "2-3 words",',
    '  "palette": ["#hex", ...] (3-5 from brief.palette),',
    '  "confidence": 0-100,',
    '  "reasoningSummary": "15 words explaining strategic choice for THIS angle and product"',
    '}',
    '',
    'ENGINE RULES:',
    '- hero_app, feature_grid, ui_focus -> canvas (real screenshots matter)',
    '- story_ad -> hybrid (generated background + real logo/text overlay)',
    '- minimal_branding -> canvas if logo strong, else flux',
    '',
    'HARD RULES:',
    '- No two headlines can be similar',
    '- No two logoPositions can be the same',
    '- Only hero_app may use mockupType "iphone"',
    '- Bullets ONLY in feature_grid. Exactly 3.',
    '- Each headline must serve its assigned angle',
    '',
    'FORBIDDEN copy phrases (reject any that use these):',
    'Revolutionize, Transform your, Unleash, Empower, Next-gen, Game-changing, Cutting-edge, Seamless, Leverage, Synergy, Paradigm, Best-in-class, Supercharge, Elevate your, Take your X to the next level, Revolucionar, Transformar tu, Potenciar, Lleva tu X al siguiente nivel, Impulsa.',
    '',
    'Respond ONLY with JSON: { "variants": [5 items] }',
  ].join('\n');
}

function normalizeVariant(raw: any, aspectRatio: AspectRatio): Variant {
  const layout = (raw.layout || 'hero_app') as VariantLayout;
  const angle = (raw.angle || LAYOUT_ANGLE_MAP[layout]) as VariantAngle;
  return {
    id: raw.id || layout + '-' + Math.random().toString(36).slice(2, 8),
    layout,
    angle,
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
      heroAssetIndex: raw.composition?.heroAssetIndex ?? undefined,
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
    // NEW in 4A
    visualDirection: raw.visualDirection || '',
    compositionHint: raw.compositionHint || '',
    intensity: (raw.intensity || 'medium') as Intensity,
    styleHint: (raw.styleHint || 'startup') as VisualStyle,
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
  if (new Set(headlines).size !== headlines.length) return false;

  const iphoneCount = variants.filter(
    (v) => v.composition.mockupType === 'iphone',
  ).length;
  if (iphoneCount > 1) return false;

  const positions = variants.map((v) => v.composition.logoPosition);
  if (new Set(positions).size < 3) return false;

  return true;
}

function computeCTA(
  variant: Variant,
  brief: ProductBrief,
  angle: VariantAngle,
): string {
  const isEs = brief.locale === 'es';

  if (variant.layout === 'ui_focus') return '';
  if (variant.layout === 'minimal_branding' && brief.campaignIntent === 'branding') {
    return '';
  }

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
  const baseComp = {
    supportAssetIndices: supportIdxs.slice(0, 3),
    logoIndex: logoIdx,
  };
  const palette = brief.palette;

  return [
    {
      id: 'story-pain-fb',
      layout: 'story_ad',
      angle: 'pain',
      intent: 'Lead with the pain point',
      engine: 'hybrid',
      intensity: 'aggressive',
      styleHint: 'cinematic',
      visualDirection:
        'Moody cinematic scene with single rim light. Atmospheric haze. Subject center-left, negative space right.',
      compositionHint:
        'Big headline center, logo top-center, aggressive CTA bottom',
      copy: {
        headline: isEs ? 'Deja de improvisar' : 'Stop guessing',
        subheadline: brief.valueProposition,
        cta: '',
      },
      composition: {
        ...baseComp,
        heroAssetIndex: heroIdx,
        logoPosition: 'top-center',
        mockupType: 'none',
      },
      mood: 'tense urgent',
      palette,
      confidence: 70,
      reasoningSummary: 'Pain-first angle to stop the scroll in feed',
      aspectRatio,
    },
    {
      id: 'hero-result-fb',
      layout: 'hero_app',
      angle: 'result',
      intent: 'Show tangible outcome',
      engine: 'canvas',
      intensity: 'medium',
      styleHint: 'startup',
      visualDirection:
        'Product hero with soft rim light. Dark premium backdrop. iPhone mockup center, glow outline.',
      compositionHint:
        'iPhone center, headline below, small logo top-right',
      copy: {
        headline: isEs ? 'Cinco anuncios. Una subida.' : 'Five ads. One upload.',
        subheadline: brief.oneLiner,
        cta: brief.suggestedCTA,
      },
      composition: {
        ...baseComp,
        heroAssetIndex: heroIdx,
        logoPosition: 'top-right',
        mockupType: 'iphone',
      },
      mood: 'premium confident',
      palette,
      confidence: 72,
      reasoningSummary: 'Result-first with product hero and clear outcome copy',
      aspectRatio,
    },
    {
      id: 'ui-authority-fb',
      layout: 'ui_focus',
      angle: 'authority',
      intent: 'Let the product prove itself',
      engine: 'canvas',
      intensity: 'soft',
      styleHint: 'minimal',
      visualDirection:
        'UI takes 70 percent of frame. Minimal decoration. Clean flat background in brand color.',
      compositionHint: 'UI center, micro-headline bottom, small logo top-left',
      copy: {
        headline: isEs ? 'Hecho para operadores' : 'Built for operators',
        subheadline: '',
        cta: '',
      },
      composition: {
        ...baseComp,
        heroAssetIndex: heroIdx,
        logoPosition: 'top-left',
        mockupType: 'none',
      },
      mood: 'quiet authority',
      palette,
      confidence: 68,
      reasoningSummary: 'Authority angle: product visible, copy restrained',
      aspectRatio,
    },
    {
      id: 'minimal-curiosity-fb',
      layout: 'minimal_branding',
      angle: 'curiosity',
      intent: 'Open a loop',
      engine: 'canvas',
      intensity: 'soft',
      styleHint: 'luxury',
      visualDirection:
        'Dark luxury backdrop with single soft light source top-left. One-line headline center. Subtle vignette.',
      compositionHint:
        'Headline center, small logo bottom-center, visible tension in lighting',
      copy: {
        headline: isEs ? 'La mayoria lo hace mal.' : 'Most brands get this wrong.',
        subheadline: '',
        cta: '',
      },
      composition: {
        ...baseComp,
        heroAssetIndex: undefined,
        logoPosition: 'bottom-center',
        mockupType: 'none',
      },
      mood: 'curious restrained',
      palette,
      confidence: 65,
      reasoningSummary: 'Curiosity angle with visual tension, never empty',
      aspectRatio,
    },
    {
      id: 'feature-aggressive-fb',
      layout: 'feature_grid',
      angle: 'aggressive',
      intent: 'Breadth with clarity',
      engine: 'canvas',
      intensity: 'aggressive',
      styleHint: 'aggressive',
      visualDirection:
        'Clean grid. Dark premium background with strong brand accent. Three features equal weight.',
      compositionHint:
        'Headline top, 3-column grid mid, small logo top-right, CTA bottom',
      copy: {
        headline: isEs
          ? 'Todo lo que necesita tu marca.'
          : 'Everything a brand needs.',
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
        ...baseComp,
        heroAssetIndex: heroIdx,
        logoPosition: 'top-right',
        mockupType: 'none',
      },
      mood: 'bold clear',
      palette,
      confidence: 70,
      reasoningSummary: 'Aggressive breadth: 3 proofs without visual noise',
      aspectRatio,
    },
  ];
}
