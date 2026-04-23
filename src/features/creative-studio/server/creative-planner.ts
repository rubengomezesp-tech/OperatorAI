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
  CampaignDirection,
} from '../types';
import { hasQualityInputs } from './hero-scoring';
import { pickDefaultStyleForLayout } from '../data/visual-styles';

const PLANNER_MODEL = 'claude-sonnet-4-5-20250929';

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

const LAYOUT_INTENSITY: Record<VariantLayout, Intensity> = {
  hero_app: 'medium',
  feature_grid: 'aggressive',
  story_ad: 'aggressive',
  minimal_branding: 'soft',
  ui_focus: 'soft',
};

/**
 * LAYER 3 — CREATIVE PLANNING v5
 *
 * Now inherits decisions from Creative Brain. The planner no longer decides
 * archetype / visual register / lighting — those are fixed by the brain.
 * The planner decides PER-VARIANT angle, copy, composition within those
 * global constraints.
 */
export async function planCampaign(
  brief: ProductBrief,
  analyses: ImageAnalysis[],
  aspectRatio: AspectRatio,
  memory?: CampaignMemory,
  direction?: CampaignDirection,
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
    direction,
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
      direction,
    );
  }

  // Post-process: apply direction-aware overrides
  variants = variants.map((v) => {
    const angle = LAYOUT_ANGLE_MAP[v.layout] || v.angle;
    const intensity = v.intensity || LAYOUT_INTENSITY[v.layout] || 'medium';
    const styleHint = applyDirectionToStyleHint(
      v.styleHint,
      v.layout,
      intensity,
      direction,
    );
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
  direction?: CampaignDirection;
}): string {
  const {
    brief,
    logoIdx,
    heroIdx,
    featureIdxs,
    supportIdxs,
    quality,
    memory,
    direction,
  } = ctx;

  const langNote =
    brief.locale === 'es'
      ? 'ALL copy in NATURAL SPANISH. Use tuteo. Natural phrasing. Correct spelling with n-tilde (campañas, años, diseño).'
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

  let directionBlock = '';
  if (direction) {
    directionBlock = [
      '',
      '═══════════════════════════════════════════',
      'ART DIRECTION (HARD CONSTRAINTS - HONOR IN EVERY VARIANT)',
      '═══════════════════════════════════════════',
      'Archetype:        ' + direction.archetype,
      'Visual register:  ' + direction.visualRegister,
      'Hero strategy:    ' + direction.heroStrategy,
      'Copy strategy:    ' + direction.copyStrategy,
      'Lighting:         ' + direction.lightingDirection,
      'Motion energy:    ' + direction.motionEnergy,
      'Palette dominant: ' + direction.paletteDirection.dominant,
      'Palette accent:   ' + direction.paletteDirection.accent,
      'Cultural refs:    ' + direction.culturalReferences.join(' | '),
      '',
      'DIRECTION STATEMENT:',
      '  ' + direction.directionStatement,
      '',
      'WHY (rationale to honor, not to repeat in copy):',
      '  ' + direction.rationale,
      '',
      'RULES',
      '- Every variant must read as coming from the SAME campaign.',
      '- visualDirection you write for each variant must reference the lighting direction and motion energy above.',
      '- copyStrategy above governs density: text_free means no headline; visual_dominant means headline <=4 words.',
      '- Do NOT invent a different archetype per variant. Variants differ by angle, not by aesthetic family.',
      '- Cultural references are internal discipline — never repeat them inside copy or visualDirection strings.',
      '',
    ].join('\n');
  }

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
    'You are a senior creative director. Output must feel like real high-end ads, not AI slop.',
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
    directionBlock,
    memoryContext,
    '',
    'GENERATE EXACTLY 5 VARIANTS. Each has a FIXED angle + layout.',
    '',
    'VARIANT 1 — story_ad (angle: pain)',
    '  Lead with a real tension or problem the user feels.',
    '  Headline sharp and direct. NO soft philosophy.',
    '  Example EN: "Stop guessing content", "Your ads are invisible"',
    '  Example ES: "Deja de improvisar", "Tus anuncios no convierten"',
    '  intensity: aggressive.',
    '',
    'VARIANT 2 — hero_app (angle: result)',
    '  Lead with the tangible outcome. Specific, concrete.',
    '  Show the product doing its job (iPhone mockup if heroStrategy allows).',
    '  Example EN: "Five ads. One upload." / Example ES: "Cinco anuncios. Una subida."',
    '  intensity: medium.',
    '',
    'VARIANT 3 — ui_focus (angle: authority)',
    '  Let the product speak. Minimal copy, strong UI presence.',
    '  Example EN: "Built for operators" / Example ES: "Hecho para operadores"',
    '  copy density: MINIMAL. intensity: soft.',
    '',
    'VARIANT 4 — minimal_branding (angle: curiosity)',
    '  Open a loop. Create tension without giving the full answer.',
    '  Must feel intentional, not empty. One short sentence + small logo.',
    '  Example EN: "Most brands get this wrong." / Example ES: "La mayoria lo hace mal."',
    '  copy density: MINIMAL. intensity: soft. MUST feel tense, not blank.',
    '',
    'VARIANT 5 — feature_grid (angle: aggressive)',
    '  Lead with breadth + punch. 3 clear features as proof.',
    '  Grid stays clean; copy headline is punchy but not noisy.',
    '  Example EN: "Everything a brand needs. In one place."',
    '  Example ES: "Todo lo que necesita tu marca. En un solo sitio."',
    '  intensity: aggressive. BULLETS: exactly 3. Parallel structure.',
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
    '  "visualDirection": "2-3 sentences. MUST echo the lighting + motion energy from the ART DIRECTION block.",',
    '  "compositionHint": "1 sentence: where hero goes, where text goes, negative space",',
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
    '  "palette": ["#hex", ...] (3-5 from direction.palette + brief.palette),',
    '  "confidence": 0-100,',
    '  "reasoningSummary": "15 words explaining strategic choice for THIS angle + how it honors the direction"',
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
    direction
      ? '- If copyStrategy is text_free, ALL variants must have empty headline and empty subheadline except feature_grid (which needs 3 bullets).'
      : '',
    direction
      ? '- If heroStrategy is brand_only, NO variant may use mockupType "iphone" and heroAssetIndex must be null.'
      : '',
    direction
      ? '- If heroStrategy is product_implied, heroAssetIndex should be undefined in most variants; rely on supportAssetIndices.'
      : '',
    '',
    'FORBIDDEN copy phrases (reject any that use these):',
    'Revolutionize, Transform your, Unleash, Empower, Next-gen, Game-changing, Cutting-edge, Seamless, Leverage, Synergy, Paradigm, Best-in-class, Supercharge, Elevate your, Take your X to the next level, Revolucionar, Transformar tu, Potenciar, Lleva tu X al siguiente nivel, Impulsa.',
    '',
    'Respond ONLY with JSON: { "variants": [5 items] }',
  ].join('\n');
}

function applyDirectionToStyleHint(
  current: VisualStyle | undefined,
  layout: VariantLayout,
  intensity: Intensity,
  direction?: CampaignDirection,
): VisualStyle {
  if (!direction) {
    return current || pickDefaultStyleForLayout(layout, intensity);
  }
  // Map visualRegister to styleHint when current is weaker than direction
  const registerToStyle: Record<string, VisualStyle> = {
    cinematic: 'cinematic',
    editorial: 'luxury',
    startup: 'startup',
    aggressive: 'aggressive',
    minimal: 'minimal',
  };
  const suggested = registerToStyle[direction.visualRegister] || 'startup';
  // Keep per-variant hint if explicitly set and coherent, else adopt direction
  if (!current) return suggested;
  // Coherent pairings
  if (direction.archetype === 'luxury' && current === 'aggressive') return 'luxury';
  if (direction.archetype === 'performance' && current === 'minimal') return suggested;
  return current;
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
  if (headlines.length > 0 && new Set(headlines).size !== headlines.length) {
    return false;
  }
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
  direction?: CampaignDirection,
): Variant[] {
  const isEs = brief.locale === 'es';
  const baseComp = {
    supportAssetIndices: supportIdxs.slice(0, 3),
    logoIndex: logoIdx,
  };
  const palette = direction
    ? [
        direction.paletteDirection.dominant,
        direction.paletteDirection.accent,
        ...direction.paletteDirection.support,
      ]
    : brief.palette;

  const lighting = direction?.lightingDirection || 'dark_premium';
  const motion = direction?.motionEnergy || 'static';
  const lightingPhrase = lighting.replace('_', ' ');
  const motionPhrase = motion;

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
        'Moody cinematic scene. ' + lightingPhrase + ' lighting. ' + motionPhrase +
        ' energy. Atmospheric haze. Subject center-left, negative space right.',
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
      reasoningSummary: 'Pain-first angle to stop the scroll',
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
        'Product hero with ' + lightingPhrase + '. ' + motionPhrase +
        ' staging. iPhone mockup center, glow outline.',
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
      reasoningSummary: 'Result-first with product hero and outcome copy',
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
        'UI takes 70 percent of frame. ' + lightingPhrase +
        '. Clean backdrop in brand color. ' + motionPhrase + ' stillness.',
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
        lightingPhrase + ' backdrop with single light source top-left. ' +
        'One-line headline center. Subtle vignette. ' + motionPhrase + ' register.',
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
      reasoningSummary: 'Curiosity with visual tension, never empty',
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
        'Clean grid. ' + lightingPhrase + ' with brand accent. ' + motionPhrase +
        ' composition. Three features equal weight.',
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
