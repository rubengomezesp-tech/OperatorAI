import 'server-only';
import { serverEnv } from '@/lib/env';
import type {
  ImageAnalysis,
  ProductBrief,
  CampaignIntent,
} from '../types';

const UNDERSTANDING_MODEL = 'claude-sonnet-4-5-20250929';

const INTENT_GUIDE: Record<CampaignIntent, string> = {
  launch:
    'Product launch. Emphasize novelty, capability, and what the product does. Energy: confident announcement.',
  conversion:
    'Drive signups or purchase. Emphasize offer, trial, price, urgency. Energy: clear action.',
  branding:
    'Build brand awareness. Emphasize identity, values, aspiration. Energy: premium, quiet confidence.',
  retargeting:
    're-engage past visitors. Emphasize missed value, social proof, return incentive. Energy: reminder.',
};

const FALLBACK_CTA: Record<CampaignIntent, { en: string; es: string }> = {
  launch: { en: 'Try it now', es: 'Pruebalo' },
  conversion: { en: 'Start free', es: 'Empieza gratis' },
  branding: { en: 'Explore', es: 'Descubrir' },
  retargeting: { en: 'Come back', es: 'Vuelve' },
};

/**
 * LAYER 2 — UNDERSTANDING
 * Synthesizes ProductBrief including campaignIntent.
 * Copy is written in locale (en or es). Spanish uses tuteo and natural phrasing.
 */
export async function synthesizeBrief(
  analyses: ImageAnalysis[],
  userInstructions: string | undefined,
  locale: 'en' | 'es',
  campaignIntent: CampaignIntent,
): Promise<ProductBrief> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

  const compact = analyses.map((a) => ({
    i: a.index,
    role: a.role,
    type: a.screenType,
    text: a.visibleText.slice(0, 10),
    ui: a.uiElements.slice(0, 8),
    colors: a.dominantColors,
    desc: a.description,
  }));

  const langNote =
    locale === 'es'
      ? [
          'Respond in NATURAL SPANISH (Spain/LatAm neutral).',
          'RULES:',
          '- Use tuteo (tu). Premium but not stiff.',
          '- Use proper Spanish spelling: campana, diseno, pequeno, ano, manana, companiia, espanol (the generator should use correct spelling including n-tilde).',
          '- No literal English calques. Adapt naturally.',
          '- "Get started" -> "Pruebalo" (not "Empezar").',
          '- "Sign up free" -> "Registrate gratis" or "Empieza gratis".',
        ].join('\n')
      : 'Respond in ENGLISH. Write like Apple, Linear, or Stripe marketing. Not HubSpot.';

  const prompt = [
    'You are a product strategist synthesizing a ProductBrief from image analyses.',
    '',
    langNote,
    '',
    'CAMPAIGN INTENT: ' + campaignIntent.toUpperCase(),
    INTENT_GUIDE[campaignIntent],
    '',
    'ANALYSES:',
    JSON.stringify(compact, null, 2),
    '',
    userInstructions ? 'USER INSTRUCTIONS: "' + userInstructions + '"' : '',
    '',
    'Return ONE ProductBrief JSON:',
    '- vertical: "saas_app" | "apparel" | "ecommerce" | "physical"',
    '- name: product name if visible (optional)',
    '- oneLiner: what the product DOES in ONE concrete sentence',
    '- features: 3-5 core features with marketing names (from actual UI and OCR, not invention)',
    '- benefits: 3-5 outcomes users feel',
    '- tone: "premium" | "playful" | "aggressive" | "minimal" | "technical"',
    '- target: specific user archetype',
    '- valueProposition: the core promise (one sentence)',
    '- palette: 3-5 hex colors aggregated from dominantColors',
    '- voiceCues: 3 adjectives for copy voice',
    '- suggestedCTA: short action (2-4 words) matching campaignIntent',
    '',
    'FORBIDDEN copy words in ANY language:',
    'Revolutionize, Transform your, Unleash, Empower, Next-gen, Game-changing, Cutting-edge, Seamless, Leverage, Synergy, Paradigm, Best-in-class, Revolucionar, Transformar tu, Potenciar.',
    '',
    'Respond ONLY with JSON.',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const res = await claude.messages.create({
      model: UNDERSTANDING_MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return normalizeBrief(parsed, locale, campaignIntent);
    }
  } catch (err) {
    console.error('[understanding-layer] error:', err);
  }

  return buildFallbackBrief(locale, campaignIntent);
}

function normalizeBrief(
  raw: any,
  locale: 'en' | 'es',
  campaignIntent: CampaignIntent,
): ProductBrief {
  return {
    vertical: raw.vertical || 'saas_app',
    name: raw.name,
    oneLiner: raw.oneLiner || buildFallbackBrief(locale, campaignIntent).oneLiner,
    features: Array.isArray(raw.features) ? raw.features.slice(0, 5) : [],
    benefits: Array.isArray(raw.benefits) ? raw.benefits.slice(0, 5) : [],
    tone: raw.tone || 'premium',
    target:
      raw.target ||
      (locale === 'es' ? 'Fundadores y marketers' : 'Founders and marketers'),
    valueProposition:
      raw.valueProposition ||
      (locale === 'es'
        ? 'Ejecucion de marca con IA'
        : 'Brand execution with AI'),
    palette: Array.isArray(raw.palette)
      ? raw.palette.slice(0, 5)
      : ['#0a0a0b', '#c9a863'],
    voiceCues: Array.isArray(raw.voiceCues)
      ? raw.voiceCues.slice(0, 3)
      : ['confident', 'premium', 'clear'],
    suggestedCTA: raw.suggestedCTA || FALLBACK_CTA[campaignIntent][locale],
    campaignIntent,
    locale,
  };
}

function buildFallbackBrief(
  locale: 'en' | 'es',
  campaignIntent: CampaignIntent,
): ProductBrief {
  return {
    vertical: 'saas_app',
    oneLiner:
      locale === 'es'
        ? 'Plataforma para crear campanas con IA'
        : 'AI platform for creating campaigns',
    features: [],
    benefits: [],
    tone: 'premium',
    target:
      locale === 'es' ? 'Fundadores y marketers' : 'Founders and marketers',
    valueProposition:
      locale === 'es' ? 'Ejecucion de marca con IA' : 'Brand execution with AI',
    palette: ['#0a0a0b', '#c9a863'],
    voiceCues: ['confident', 'premium', 'technical'],
    suggestedCTA: FALLBACK_CTA[campaignIntent][locale],
    campaignIntent,
    locale,
  };
}
