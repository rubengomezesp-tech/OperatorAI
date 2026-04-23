import 'server-only';
import { serverEnv } from '@/lib/env';
import type {
  ProductBrief,
  ImageAnalysis,
  CampaignDirection,
  CampaignArchetype,
  VisualRegister,
  HeroStrategy,
  CopyStrategy,
  LightingDirection,
  MotionEnergy,
  CampaignIntent,
} from '../types';
import { hasQualityInputs } from './hero-scoring';

const BRAIN_MODEL = 'claude-sonnet-4-5-20250929';

/**
 * CREATIVE BRAIN
 *
 * Runs AFTER understanding-layer, BEFORE creative-planner.
 *
 * Responsibility:
 *   Decide the campaign-level creative direction as a senior art director would.
 *   The planner then inherits these decisions as hard constraints — it only
 *   decides per-variant angle/copy/composition, not the overall aesthetic.
 *
 * This is NOT a prompt injected into Flux. This is a structured set of
 * decisions that feed the planner and, through it, the renderers.
 *
 * Failure mode: if Claude returns something invalid, we fall back to a
 * deterministic direction chosen from brief tone + intent. The pipeline
 * never dies because the brain hiccuped.
 */
export async function deriveCampaignDirection(
  brief: ProductBrief,
  analyses: ImageAnalysis[],
  userNotes?: string,
): Promise<CampaignDirection> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

  const quality = hasQualityInputs(analyses);
  const prompt = buildBrainPrompt(brief, analyses, quality, userNotes);

  try {
    const res = await claude.messages.create({
      model: BRAIN_MODEL,
      max_tokens: 1400,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackDirection(brief);

    const parsed = JSON.parse(match[0]);
    return normalizeDirection(parsed, brief);
  } catch (err) {
    console.error('[creative-brain] error:', err);
    return fallbackDirection(brief);
  }
}

function buildBrainPrompt(
  brief: ProductBrief,
  analyses: ImageAnalysis[],
  quality: ReturnType<typeof hasQualityInputs>,
  userNotes?: string,
): string {
  const isEs = brief.locale === 'es';

  const intentContext: Record<CampaignIntent, string> = {
    launch:
      'LAUNCH: first-contact campaign. We want arresting openers that stop the scroll and plant the product identity. Lean editorial, lean cinematic. Avoid discount language.',
    conversion:
      'CONVERSION: performance advertising. Direct-response energy. Clear value, explicit incentive, aggressive tension. Luxury still works but must be paired with urgency.',
    branding:
      'BRANDING: identity reinforcement for an audience that already knows us. Aspirational, restrained, high craft. Copy minimal. Texture and lighting do the talking.',
    retargeting:
      'RETARGETING: they saw it, they left. We want familiarity with friction. Slightly darker emotional register. Cue recognition, close with friction removal.',
  };

  return [
    'You are a senior art director at a top creative agency (think Wieden+Kennedy, BBH, Uncommon).',
    'You have just received a product brief and image assets. Before handing off to the layout planner,',
    'you decide the campaign-level creative direction. These decisions are strategic, not tactical.',
    '',
    'Your output is a structured JSON object that will anchor every visual decision downstream.',
    '',
    'LANGUAGE: reasoning in English. Any human-facing label in ' +
      (isEs ? 'Spanish (tuteo, natural phrasing).' : 'English, Apple-2024 product register.'),
    '',
    'INTENT CONTEXT:',
    intentContext[brief.campaignIntent],
    '',
    'BRIEF:',
    JSON.stringify(brief, null, 2),
    '',
    'ASSET QUALITY:',
    '- Logo present: ' + quality.hasLogo,
    '- Hero score: ' + quality.heroScore,
    '- Screen assets: ' + analyses.filter((a) => a.isScreenshot).length,
    '- Lifestyle assets: ' +
      analyses.filter((a) => a.communicates === 'ambience').length,
    '',
    userNotes
      ? 'USER DIRECTIVE (honor but do not let override your craft judgment): ' +
        userNotes
      : '',
    '',
    '═══════════════════════════════════════════',
    'DECISIONS YOU MUST MAKE',
    '═══════════════════════════════════════════',
    '',
    '1. ARCHETYPE — what kind of campaign is this, emotionally?',
    '   - "luxury": restraint, negative space, editorial polish. Black + gold, or muted earth, or true monochrome. Breath.',
    '   - "performance": direct response, urgency, punch. Hard contrast, offer-led, tight framing.',
    '   - "viral": scroll-stopping, culturally legible, intentionally off-center or irreverent.',
    '   - "launch": announcement energy, reveal beats, product hero dominant, cinematic confidence.',
    '   - "editorial": magazine/museum register, typographic craft, slow pacing, aspirational.',
    '',
    '2. VISUAL REGISTER — the aesthetic family.',
    '   - "cinematic": three-layer depth, anamorphic bokeh, atmospheric haze, motivated light.',
    '   - "editorial": studio-lit still life, refined typography, plenty of margin.',
    '   - "startup": contemporary SaaS ad, clean gradient, crisp product hero, optimistic.',
    '   - "aggressive": high-contrast, hard shadows, diagonal energy, tight crop.',
    '   - "minimal": scandinavian, flat daylight, single subject, generous whitespace.',
    '',
    '3. HERO STRATEGY — how the product appears.',
    '   - "device_centered": iPhone/laptop front and center, reverent framing.',
    '   - "device_angled": product at 15-30 degree tilt, depth cue, cinematic.',
    '   - "contextual": product inside a scene (hand, desk, environment).',
    '   - "product_implied": product is hinted at via UI fragments or reflections, not shown directly.',
    '   - "brand_only": no product visible, logo + typography carry everything.',
    '',
    '4. COPY STRATEGY',
    '   - "text_dominant": copy is 50-70% of visual weight. Use when hook is the product.',
    '   - "visual_dominant": copy is a whisper. Use when visual is strong.',
    '   - "balanced": 50/50 weighting.',
    '   - "text_free": no copy at all — identity only.',
    '',
    '5. LIGHTING DIRECTION',
    '   - "dark_premium": deep blacks, single rim light, soft gold highlights.',
    '   - "high_key": bright, flat daylight, minimal shadow.',
    '   - "chiaroscuro": hard directional light, dramatic fall-off.',
    '   - "ambient_glow": atmospheric, diffused, color-graded haze.',
    '   - "flat_editorial": even studio light, no drama, lets product speak.',
    '',
    '6. MOTION ENERGY (visual energy, not literal motion)',
    '   - "static": composed, still, deliberate. Editorial.',
    '   - "kinetic": diagonal, tight crop, implied speed, performance ad.',
    '   - "atmospheric": depth, haze, slow-moving mood. Cinematic.',
    '',
    '7. PALETTE DIRECTION — synthesize from brief.palette but you may add one accent.',
    '   Be specific. 3-5 hex values. One dominant, one accent, optional support tones.',
    '',
    '8. THREE CULTURAL REFERENCES — name real campaigns, films, editorials, or magazines that anchor this direction.',
    '   These are NOT shown to the user. They discipline the downstream planner and renderers so we avoid AI slop.',
    '   Example: ["Apple Shot on iPhone 2022", "Linear landing page 2024", "Kinfolk Magazine editorial"]',
    '   Do NOT invent fictional campaigns. Use real, known references.',
    '',
    '9. ONE-LINE DIRECTION STATEMENT — the art director note you would write on a brief cover.',
    '   Sharp, specific, un-AI. 10-18 words.',
    '   Example good: "Restrained luxury, black-on-black, single rim light, text whispered bottom-right."',
    '   Example bad:  "Make it premium and beautiful with lots of detail and elegance." (vague, slop)',
    '',
    '10. RATIONALE — 2-3 sentences explaining WHY this direction fits this brief.',
    '    Reference the intent, the tone, the asset quality. This justifies the strategy.',
    '',
    '═══════════════════════════════════════════',
    'OUTPUT — JSON ONLY, no preamble',
    '═══════════════════════════════════════════',
    '{',
    '  "archetype": "luxury" | "performance" | "viral" | "launch" | "editorial",',
    '  "visualRegister": "cinematic" | "editorial" | "startup" | "aggressive" | "minimal",',
    '  "heroStrategy": "device_centered" | "device_angled" | "contextual" | "product_implied" | "brand_only",',
    '  "copyStrategy": "text_dominant" | "visual_dominant" | "balanced" | "text_free",',
    '  "lightingDirection": "dark_premium" | "high_key" | "chiaroscuro" | "ambient_glow" | "flat_editorial",',
    '  "motionEnergy": "static" | "kinetic" | "atmospheric",',
    '  "paletteDirection": {',
    '    "dominant": "#hex",',
    '    "accent": "#hex",',
    '    "support": ["#hex", "#hex"]',
    '  },',
    '  "culturalReferences": ["real ref 1", "real ref 2", "real ref 3"],',
    '  "directionStatement": "the one-line brief",',
    '  "rationale": "2-3 sentence justification"',
    '}',
  ].join('\n');
}

function normalizeDirection(
  raw: any,
  brief: ProductBrief,
): CampaignDirection {
  const validArchetypes: CampaignArchetype[] = [
    'luxury',
    'performance',
    'viral',
    'launch',
    'editorial',
  ];
  const validRegisters: VisualRegister[] = [
    'cinematic',
    'editorial',
    'startup',
    'aggressive',
    'minimal',
  ];
  const validHero: HeroStrategy[] = [
    'device_centered',
    'device_angled',
    'contextual',
    'product_implied',
    'brand_only',
  ];
  const validCopy: CopyStrategy[] = [
    'text_dominant',
    'visual_dominant',
    'balanced',
    'text_free',
  ];
  const validLighting: LightingDirection[] = [
    'dark_premium',
    'high_key',
    'chiaroscuro',
    'ambient_glow',
    'flat_editorial',
  ];
  const validMotion: MotionEnergy[] = ['static', 'kinetic', 'atmospheric'];

  const pick = <T extends string>(value: any, allowed: T[], fallback: T): T =>
    allowed.includes(value) ? (value as T) : fallback;

  const fb = fallbackDirection(brief);

  const dominant =
    (raw.paletteDirection?.dominant as string) ||
    brief.palette?.[0] ||
    fb.paletteDirection.dominant;
  const accent =
    (raw.paletteDirection?.accent as string) ||
    brief.palette?.[1] ||
    fb.paletteDirection.accent;
  const support = Array.isArray(raw.paletteDirection?.support)
    ? (raw.paletteDirection.support as string[]).slice(0, 3)
    : fb.paletteDirection.support;

  return {
    archetype: pick(raw.archetype, validArchetypes, fb.archetype),
    visualRegister: pick(
      raw.visualRegister,
      validRegisters,
      fb.visualRegister,
    ),
    heroStrategy: pick(raw.heroStrategy, validHero, fb.heroStrategy),
    copyStrategy: pick(raw.copyStrategy, validCopy, fb.copyStrategy),
    lightingDirection: pick(
      raw.lightingDirection,
      validLighting,
      fb.lightingDirection,
    ),
    motionEnergy: pick(raw.motionEnergy, validMotion, fb.motionEnergy),
    paletteDirection: { dominant, accent, support },
    culturalReferences: Array.isArray(raw.culturalReferences)
      ? raw.culturalReferences.slice(0, 3).map((r: any) => String(r))
      : fb.culturalReferences,
    directionStatement:
      typeof raw.directionStatement === 'string' && raw.directionStatement.trim()
        ? raw.directionStatement.trim()
        : fb.directionStatement,
    rationale:
      typeof raw.rationale === 'string' && raw.rationale.trim()
        ? raw.rationale.trim()
        : fb.rationale,
  };
}

function fallbackDirection(brief: ProductBrief): CampaignDirection {
  // Deterministic direction based on intent + tone. Safe, boring, ships.
  const intent = brief.campaignIntent;
  const tone = brief.tone;

  let archetype: CampaignArchetype = 'launch';
  let visualRegister: VisualRegister = 'startup';
  let heroStrategy: HeroStrategy = 'device_centered';
  let copyStrategy: CopyStrategy = 'balanced';
  let lightingDirection: LightingDirection = 'dark_premium';
  let motionEnergy: MotionEnergy = 'static';

  if (intent === 'conversion') {
    archetype = 'performance';
    visualRegister = 'aggressive';
    copyStrategy = 'text_dominant';
    lightingDirection = 'chiaroscuro';
    motionEnergy = 'kinetic';
  } else if (intent === 'branding') {
    archetype = 'editorial';
    visualRegister = 'editorial';
    copyStrategy = 'visual_dominant';
    lightingDirection = 'flat_editorial';
    motionEnergy = 'static';
  } else if (intent === 'retargeting') {
    archetype = 'performance';
    visualRegister = 'cinematic';
    copyStrategy = 'balanced';
    lightingDirection = 'ambient_glow';
    motionEnergy = 'atmospheric';
  }

  if (tone === 'premium' || tone === 'minimal') {
    archetype = archetype === 'performance' ? 'luxury' : archetype;
    visualRegister = visualRegister === 'aggressive' ? 'cinematic' : visualRegister;
    lightingDirection = 'dark_premium';
  }

  const palette = brief.palette && brief.palette.length > 0
    ? brief.palette
    : ['#0a0a0b', '#c9a863', '#1a1a1a'];

  return {
    archetype,
    visualRegister,
    heroStrategy,
    copyStrategy,
    lightingDirection,
    motionEnergy,
    paletteDirection: {
      dominant: palette[0] || '#0a0a0b',
      accent: palette[1] || '#c9a863',
      support: palette.slice(2, 5),
    },
    culturalReferences: [
      'Apple product launch keynote stills',
      'Linear landing page 2024',
      'Kinfolk editorial spreads',
    ],
    directionStatement:
      'Restrained ' + archetype + ' register, ' + lightingDirection.replace('_', ' ') +
      ', product hero ' + heroStrategy.replace('_', ' ') + '.',
    rationale:
      'Safe deterministic direction derived from intent (' +
      intent +
      ') and tone (' +
      tone +
      '). Replace with brain output when available.',
  };
}
