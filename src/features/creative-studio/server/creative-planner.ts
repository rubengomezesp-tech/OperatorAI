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
  ProductCategory,
  AdScenario,
} from '../types';
import {
  assignDiverseStyles,
  pickDefaultStyleForLayout,
  normalizeVisualStyle,
} from '../data/visual-styles';
import {
  detectProductCategory,
  getScenariosForCategory,
  assignScenarios,
} from './product-intelligence';

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

  // ── PRODUCT INTELLIGENCE ─────────────────────────────────
  const productCategory = detectProductCategory(brief, analyses);
  const categoryScenarios = getScenariosForCategory(productCategory);

  console.log('[planner] category detected:', productCategory);
  console.log(
    '[planner] scenarios available:',
    categoryScenarios.map((s) => s.id),
  );

  const memoryBlock =
    memory && memory.previousVariants?.length
      ? `
PREVIOUS ITERATION CONTEXT:
Rejected IDs: ${JSON.stringify(memory.rejectedVariantIds || [])}
Selected ID: ${JSON.stringify(memory.selectedVariantId || null)}
Regeneration count: ${memory.regenerationCount || 0}
Previous variants (avoid repeating):
${JSON.stringify(memory.previousVariants.map((v) => ({
  layout: v.layout,
  angle: v.angle,
  scenarioId: v.scenario?.id,
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

  const scenariosBlock = `
PRODUCT CATEGORY DETECTED: ${productCategory}

AVAILABLE AD SCENARIOS FOR THIS CATEGORY:
${categoryScenarios
  .map(
    (s, i) =>
      `${i + 1}. ${s.name} [id: ${s.id}]
   Scene: ${s.sceneDescription}
   Framing: ${s.subjectFraming}
   Overlay space: ${s.overlaySpace}`,
  )
  .join('\n\n')}

You MUST use these scenarios to build relevant ads for this product category.
Each variant should select ONE scenario that fits its layout and angle.
The scenarioId field in your output must match one of the above ids.
`;

  const prompt = `
You are a senior creative director at a top advertising agency.

Product category: ${productCategory}

Your job: generate 5 ad variants using the provided scenarios for this category.
Each variant must feel like a different ad direction — different framing, different mood — while staying relevant to the product category.

${scenariosBlock}

═══════════════════════════════
COPY RULES
═══════════════════════════════

- No generic marketing phrases
- No "revolutionary", "next-gen", "game-changing"
- Sharp, specific, real
- Copy tone matches the visual direction
- Copy for product category: reference real benefits, not abstract claims

═══════════════════════════════
VISUAL DIRECTION FIELD (visualDirection)
═══════════════════════════════

Build on the chosen scenario's sceneDescription.
Add specific, concrete details the scenario suggests.
Include: subject placement, lighting character, materials, mood through sensory detail.

═══════════════════════════════
OUTPUT (JSON ONLY)
═══════════════════════════════

{ "variants": [
  {
    "id": "...",
    "layout": "hero_app" | "feature_grid" | "story_ad" | "minimal_branding" | "ui_focus",
    "angle": "pain" | "result" | "authority" | "curiosity" | "aggressive",
    "intent": "...",
    "scenarioId": "<ONE of the scenario ids from the list above>",
    "visualDirection": "...concrete scene description building on the scenario...",
    "compositionHint": "...where subject sits, where text goes...",
    "intensity": "soft" | "medium" | "aggressive",
    "mood": "...one word mood...",
    "palette": ["#hex", "#hex"],
    "copy": { "headline": "...", "subheadline": "...", "cta": "..." }
  }
  // x 5 total — USE DIFFERENT scenarios where possible
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
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON from Claude');

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      throw new Error('No variants array from Claude');
    }

    // Normalize and enrich with scenario data
    const normalized: Variant[] = parsed.variants.map((v: any) =>
      normalize(v, aspectRatio, productCategory, categoryScenarios),
    );

    // Fill any missing scenarios by assigning pool scenarios round-robin
    const backupScenarios = assignScenarios(productCategory, normalized.length);
    for (let i = 0; i < normalized.length; i++) {
      if (!normalized[i].scenario) {
        normalized[i].scenario = backupScenarios[i];
      }
    }

    // DIVERSITY PASS — assign one different style per variant.
    // Uses scenario's preferredStyles to bias selection toward category-appropriate styles.
    const layouts = normalized.map((v: Variant) => v.layout);
    const intensities = normalized.map((v: Variant) => v.intensity);
    const preferredPools = normalized.map(
      (v: Variant) => v.scenario?.preferredStyles,
    );

    const assignedStyles = assignDiverseStyles(
      layouts,
      intensities,
      preferredPools,
    );

    for (let i = 0; i < normalized.length; i++) {
      normalized[i].styleHint = assignedStyles[i];
    }

    return normalized;
  } catch (err) {
    console.error('[planner] error:', err);
    return fallback(brief, aspectRatio, productCategory);
  }
}

function normalize(
  v: any,
  aspectRatio: AspectRatio,
  productCategory: ProductCategory,
  categoryScenarios: AdScenario[],
): Variant {
  const layout = v.layout || 'hero_app';
  const intensity = v.intensity || 'medium';

  // Resolve scenario by id from Claude response
  let scenario: AdScenario | undefined;
  if (v.scenarioId && typeof v.scenarioId === 'string') {
    scenario = categoryScenarios.find((s) => s.id === v.scenarioId);
  }

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
    palette:
      Array.isArray(v.palette) && v.palette.length > 0
        ? v.palette.slice(0, 5)
        : [],
    confidence: typeof v.confidence === 'number' ? v.confidence : 70,
    reasoningSummary: v.reasoningSummary || '',

    aspectRatio,
    visualDirection:
      v.visualDirection ||
      scenario?.sceneDescription ||
      'Clear focal subject in a visible environment with considered lighting',
    compositionHint:
      v.compositionHint ||
      scenario?.subjectFraming ||
      'Subject off-center with reserved space for overlay text',
    intensity,
    styleHint:
      (v.styleHint as VisualStyle) ||
      pickDefaultStyleForLayout(layout, intensity),

    // Enrichment
    scenario,
    productCategory,
  };
}

// ═══════════════════════════════════════════════════════════════════
// FALLBACK — uses scenarios from detected category
// ═══════════════════════════════════════════════════════════════════

function fallback(
  brief: ProductBrief,
  aspectRatio: AspectRatio,
  productCategory: ProductCategory,
): Variant[] {
  const isEs = brief.locale === 'es';
  const palette =
    brief.palette && brief.palette.length > 0
      ? brief.palette
      : ['#1a1a1a', '#f5f5f5'];

  const scenarios = getScenariosForCategory(productCategory);

  const layouts: Array<Variant['layout']> = [
    'hero_app',
    'story_ad',
    'ui_focus',
    'minimal_branding',
    'feature_grid',
  ];
  const angles: Array<Variant['angle']> = [
    'result',
    'pain',
    'authority',
    'curiosity',
    'aggressive',
  ];
  const intensities: Array<Variant['intensity']> = [
    'medium',
    'aggressive',
    'soft',
    'soft',
    'medium',
  ];

  const variants: Variant[] = [];

  for (let i = 0; i < 5; i++) {
    const scenario = scenarios[i % scenarios.length];
    const preferredStyle =
      scenario.preferredStyles[0] ||
      pickDefaultStyleForLayout(layouts[i], intensities[i]);

    variants.push({
      id: `fallback-${i + 1}`,
      layout: layouts[i],
      angle: angles[i],
      intent: `fallback for ${productCategory}`,
      engine: 'flux',
      copy: {
        headline: defaultHeadline(productCategory, i, isEs),
        subheadline: '',
        cta: i === 4 ? (isEs ? 'Ver más' : 'See more') : '',
      },
      composition: {
        heroAssetIndex: undefined,
        supportAssetIndices: [],
        logoIndex: undefined,
        logoPosition: 'top-right',
        mockupType: 'none',
      },
      mood: 'confident',
      palette,
      confidence: 50,
      reasoningSummary: 'fallback with category scenario',
      aspectRatio,
      visualDirection: scenario.sceneDescription,
      compositionHint: scenario.subjectFraming,
      intensity: intensities[i],
      styleHint: preferredStyle,
      scenario,
      productCategory,
    });
  }

  return variants;
}

function defaultHeadline(
  category: ProductCategory,
  index: number,
  isEs: boolean,
): string {
  if (isEs) {
    const lines = [
      'Diseñado para durar.',
      'Lo sentirás distinto.',
      'Hecho con precisión.',
      'Pensado para ti.',
      'Todo en uno.',
    ];
    return lines[index] || lines[0];
  }
  const lines = [
    'Built to last.',
    'Feel the difference.',
    'Made with precision.',
    'Designed for you.',
    'Everything in one.',
  ];
  return lines[index] || lines[0];
}
