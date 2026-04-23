import 'server-only';
import { serverEnv } from '@/lib/env';
import type {
  ProductBrief,
  ImageAnalysis,
  Variant,
  VariantLayout,
  VariantAngle,
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
 * CREATIVE PLANNER v6
 *
 * Responsibilities (scoped):
 *   - Pick the 5 angle+layout pairs (fixed mapping).
 *   - Write the copy (headline, subheadline, cta, bullets).
 *   - Write visualDirection per variant (scene, light, motion).
 *   - Write compositionHint per variant.
 *   - Pick styleHint + intensity per variant.
 *
 * NOT planner's responsibility anymore:
 *   - Engine selection. All variants render through Flux. The `engine`
 *     field on Variant is kept in the type for backward compatibility
 *     and is hardcoded to 'flux' at normalization.
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
    console.warn('[creative-planner] validation failed, using fallback');
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

  // Post-process: angle + intensity + styleHint + CTA coherent, engine forced to flux
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
      engine: 'flux', // HARD override — router ignores this anyway
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
      ? 'ALL copy in NATURAL SPANISH. Use tuteo. Correct n-tilde spelling (campañas, años, diseño).'
      : 'ALL copy in ENGLISH. Apple-2024 product register. Not HubSpot.';

  const intentGuide: Record<CampaignIntent, string> = {
    launch: 'LAUNCH: announcement energy. Novelty + capability.',
    conversion: 'CONVERSION: value + incentive. Aggressive CTA.',
    branding: 'BRANDING: identity + aspiration. CTA soft or omitted.',
    retargeting: 'RETARGETING: recognition + friction removal.',
  };

  let directionBlock = '';
  if (direction) {
    directionBlock = [
      '',
      '═══════════════════════════════════════════',
      'ART DIRECTION (HARD CONSTRAINTS)',
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
      'DIRECTION STATEMENT: ' + direction.directionStatement,
      '',
      'RULES:',
      '- Every variant reads as the SAME campaign.',
      '- visualDirection of each variant MUST reference the lighting + motion above.',
      '- copyStrategy governs density (text_free = no headline; visual_dominant = <=4 word headline).',
      '- Do NOT vary archetype across variants. Variants differ by angle, not by aesthetic family.',
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
      'PREVIOUS ITERATION (#' + (memory.regenerationCount + 1) + '):',
    ];
    if (rejected.length > 0) {
      lines.push('REJECTED (do not repeat angle or copy):');
      rejected.forEach((v) =>
        lines.push('- ' + v.layout + ': "' + v.copy.headline + '" (' + v.angle + ')'),
      );
    }
    if (selected) {
      lines.push(
        'LIKED: "' +
          selected.copy.headline +
          '" (' +
          selected.layout +
          '). Keep energy, new phrasing.',
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
    'ASSETS (1-based index):',
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
    'IMPORTANT RENDER CONTRACT:',
    '- Every variant will be rendered as a full AI-generated photographic image (Flux).',
    '- The image must NOT contain any text. Copy is overlaid later by the editor.',
    '- Therefore visualDirection must describe the SCENE (light, depth, composition,',
    '  subject placement, atmosphere). It must NOT contain phrases like "headline here"',
    '  or "text at top". Reserve space via composition, do not describe the text itself.',
    '',
    'GENERATE EXACTLY 5 VARIANTS. Fixed angle + layout mapping:',
    '',
    'VARIANT 1 — story_ad (angle: pain)',
    '  Scene: moody cinematic tension. Subject off-center, negative space where the headline will land.',
    '  Copy: sharp, direct. Example EN: "Stop guessing" / ES: "Deja de improvisar".',
    '  intensity: aggressive.',
    '',
    'VARIANT 2 — hero_app (angle: result)',
    '  Scene: product hero on refined backdrop. Reserve lower third for copy.',
    '  Copy: tangible outcome. Example EN: "Five ads. One upload." / ES: "Cinco anuncios. Una subida."',
    '  intensity: medium.',
    '',
    'VARIANT 3 — ui_focus (angle: authority)',
    '  Scene: clean backdrop highlighting product presence. Minimal copy space.',
    '  Copy: minimal credibility statement. EN: "Built for operators" / ES: "Hecho para operadores".',
    '  intensity: soft.',
    '',
    'VARIANT 4 — minimal_branding (angle: curiosity)',
    '  Scene: dark luxury backdrop with single directional light. Tension through chiaroscuro.',
    '  Copy: one sharp line opening a loop. EN: "Most brands get this wrong." / ES: "La mayoria lo hace mal."',
    '  intensity: soft. MUST feel tense, not empty.',
    '',
    'VARIANT 5 — feature_grid (angle: aggressive)',
    '  Scene: clean upper area for headline, horizontal zone mid-frame for 3 feature areas, bottom for CTA.',
    '  Copy: breadth + punch. Exactly 3 bullets, parallel structure.',
    '  EN: "Everything a brand needs." / ES: "Todo lo que necesita tu marca."',
    '  intensity: aggressive.',
    '',
    'FOR EACH VARIANT return:',
    '{',
    '  "id": "short-slug",',
    '  "layout": "hero_app" | "feature_grid" | "story_ad" | "minimal_branding" | "ui_focus",',
    '  "angle": "pain" | "result" | "authority" | "curiosity" | "aggressive",',
    '  "intent": "1 sentence why this variant exists",',
    '  "intensity": "soft" | "medium" | "aggressive",',
    '  "styleHint": "luxury" | "minimal" | "startup" | "aggressive" | "cinematic",',
    '  "visualDirection": "2-3 sentences describing ONLY the scene: light, depth, subject, mood. NO references to text or copy placement by name.",',
    '  "compositionHint": "1 sentence: where subject goes, where negative space reserves for copy",',
    '  "copy": {',
    '    "headline": "max 6 words, specific, punchy",',
    '    "subheadline": "max 12 words, concrete benefit or empty",',
    '    "cta": "2-4 words or empty",',
    '    "bullets": ["x","y","z"] (only for feature_grid)',
    '  },',
    '  "composition": {',
    '    "heroAssetIndex": number or null,',
    '    "supportAssetIndices": [0-3 indices],',
    '    "logoIndex": ' + (logoIdx ?? 'null') + ',',
    '    "logoPosition": "top-left" | "top-right" | "top-center" | "bottom-center",',
    '    "mockupType": "iphone" (hero_app only) | "none"',
    '  },',
    '  "mood": "2-3 words",',
    '  "palette": ["#hex", ...] (3-5 from brief + direction),',
    '  "confidence": 0-100,',
    '  "reasoningSummary": "15 words: why this angle, how it honors the direction"',
    '}',
    '',
    'HARD RULES:',
    '- No two headlines similar.',
    '- No two logoPositions identical.',
    '- Only hero_app may use mockupType "iphone".',
    '- Bullets ONLY in feature_grid. Exactly 3.',
    direction && direction.copyStrategy === 'text_free'
      ? '- copyStrategy is text_free: all headlines, subheadlines, ctas MUST be empty except feature_grid bullets.'
      : '',
    direction && direction.heroStrategy === 'brand_only'
      ? '- heroStrategy is brand_only: NO variant may use mockupType "iphone", heroAssetIndex must be null.'
      : '',
    '',
    'FORBIDDEN copy phrases:',
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
  if (!direction) return current || pickDefaultStyleForLayout(layout, intensity);
  const registerToStyle: Record<string, VisualStyle> = {
    cinematic: 'cinematic',
    editorial: 'luxury',
    startup: 'startup',
    aggressive: 'aggressive',
    minimal: 'minimal',
  };
  const suggested = registerToStyle[direction.visualRegister] || 'startup';
  if (!current) return suggested;
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
    engine: 'flux',
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
  const lightingPhrase = (direction?.lightingDirection || 'dark_premium').replace(
    '_',
    ' ',
  );
  const motionPhrase = direction?.motionEnergy || 'static';

  return [
    {
      id: 'story-pain-fb',
      layout: 'story_ad',
      angle: 'pain',
      intent: 'Lead with the pain point',
      engine: 'flux',
      intensity: 'aggressive',
      styleHint: 'cinematic',
      visualDirection:
        'Moody cinematic scene. ' +
        lightingPhrase +
        '. Subject off-center, atmospheric haze, negative space on the right third for text overlay.',
      compositionHint:
        'Subject center-left, right third reserved clean for headline',
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
      reasoningSummary: 'Pain-first angle, scene reserves copy zone',
      aspectRatio,
    },
    {
      id: 'hero-result-fb',
      layout: 'hero_app',
      angle: 'result',
      intent: 'Show tangible outcome',
      engine: 'flux',
      intensity: 'medium',
      styleHint: 'startup',
      visualDirection:
        'Refined product backdrop. ' +
        lightingPhrase +
        '. ' +
        motionPhrase +
        ' framing. Subject upper two thirds, lower third clean for copy.',
      compositionHint: 'Subject upper two thirds, lower third negative space',
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
      reasoningSummary: 'Outcome-first, copy zone reserved lower',
      aspectRatio,
    },
    {
      id: 'ui-authority-fb',
      layout: 'ui_focus',
      angle: 'authority',
      intent: 'Let the product prove itself',
      engine: 'flux',
      intensity: 'soft',
      styleHint: 'minimal',
      visualDirection:
        'Clean flat backdrop in brand tone. ' +
        lightingPhrase +
        '. Single focal subject center, generous breathing room all sides.',
      compositionHint: 'Subject center, all sides negative',
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
      reasoningSummary: 'Authority via restraint, copy minimal',
      aspectRatio,
    },
    {
      id: 'minimal-curiosity-fb',
      layout: 'minimal_branding',
      angle: 'curiosity',
      intent: 'Open a loop',
      engine: 'flux',
      intensity: 'soft',
      styleHint: 'luxury',
      visualDirection:
        lightingPhrase +
        ' backdrop with single directional light source upper-left. Subtle chiaroscuro. Dark premium vignette. Composition biased to center for a one-line headline overlay.',
      compositionHint:
        'Vignette center-biased, lighting creates tension in empty frame',
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
      reasoningSummary: 'Tension via lighting, frame ready for one line',
      aspectRatio,
    },
    {
      id: 'feature-aggressive-fb',
      layout: 'feature_grid',
      angle: 'aggressive',
      intent: 'Breadth with clarity',
      engine: 'flux',
      intensity: 'aggressive',
      styleHint: 'aggressive',
      visualDirection:
        'Clean horizontal composition, ' +
        lightingPhrase +
        '. Upper third clean for headline, mid band visually rhythmic for three feature zones, bottom reserved for CTA.',
      compositionHint:
        'Three horizontal bands: headline top, features mid, CTA bottom',
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
      reasoningSummary: 'Three bands reserve clean zones for headline + features + CTA',
      aspectRatio,
    },
  ];
}
