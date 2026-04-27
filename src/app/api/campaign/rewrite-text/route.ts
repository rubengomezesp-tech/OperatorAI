/**
 * /api/campaign/rewrite-text
 *
 * Rewrite a piece of copy (headline, subheadline, CTA) using Claude
 * Sonnet 4.5 with full context:
 *   - The original text being rewritten
 *   - The vertical (so tone matches industry)
 *   - The desired tone shift (urgent / authority / casual / luxury / curiosity)
 *   - The angle of the variant
 *   - The hook framework if available
 *
 * Returns 3 variations to choose from.
 *
 * Body:
 * {
 *   originalText: string,
 *   kind: 'headline' | 'cta' | 'body',
 *   tone: 'urgent' | 'authority' | 'casual' | 'luxury' | 'curiosity',
 *   vertical?: VerticalSlug,
 *   angle?: string,
 *   framework?: string,
 *   locale?: 'en' | 'es',
 * }
 *
 * Returns: { variations: string[] }
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 600;

// ─────────────────────────────────────────────────────────────────
// Vertical-aware tone hints
// ─────────────────────────────────────────────────────────────────

const VERTICAL_VOICE: Record<string, string> = {
  'travel-hospitality':
    'Sophisticated, evocative, never imperative. Travel-magazine tone. Examples: "Where time slows", "An invitation to disappear".',
  'jewelry-luxury':
    'Refined, restrained, confident. Never desperate. Examples: "A piece for the moments that matter", "Made to be worn for years".',
  'food-beverage':
    'Sensorial, immediate, appetizing. Active verbs. Examples: "Pulled from the wood-fired oven", "Served until midnight".',
  'fitness-wellness':
    'Direct, motivating, action-oriented. Examples: "Show up. The rest follows.", "Train like you mean it".',
  'beauty-cosmetics':
    'Sensorial, intimate, glow-focused. Examples: "Skin that feels like skin", "Glow that earns a second look".',
  'fashion-apparel':
    'Editorial, attitude-led. Examples: "Dressed for the day you decide.", "The piece you reach for again".',
  'tech-saas-app':
    'Clear, benefit-led, never jargon. Examples: "Ship faster. Sleep better.", "Your team\'s second brain".',
  'real-estate':
    'Aspirational, lifestyle-led. Examples: "More than an address.", "A view worth waking up for".',
  'home-decor':
    'Warm, considered, materials-led. Examples: "Made to be lived with.", "Texture you can feel from across the room".',
  'health-medical':
    'Calm, capable, hopeful. Never scary. Examples: "Care that fits your life.", "Feel like yourself again".',
  'education-online':
    'Aspirational, capability-led. Examples: "Learn the craft. Become the work.", "Your next 90 days, transformed".',
  'automotive':
    'Cinematic, performance-led. Examples: "Built for the long road.", "Every drive, a decision".',
  'pets':
    'Warm, authentic, never saccharine. Examples: "What they would order, if they could.", "For the dog who runs the house".',
  'finance-fintech':
    'Confident, calm, never salesy. Examples: "Money, finally simple.", "Built for the way you actually save".',
  'services-coaching':
    'Authoritative + warm. Outcome-focused. Examples: "The work that changes the work.", "From stuck to shipping in 6 weeks".',
  'ecommerce-physical':
    'Specific, benefit-led. Examples: "The one we re-order.", "Built once. Buy once.".',
  'other':
    'Editorial, modern, never cliched.',
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  urgent:
    'Add a sense of time pressure WITHOUT being cheesy or sales-y. Use deadlines or scarcity if context allows. Never use exclamation marks excessively.',
  authority:
    'Sound like the established expert. Reference outcome, credibility, or specificity. No bragging. Use specific numbers or claims when possible.',
  casual:
    'Conversational, like talking to a friend. Contractions OK. Lower the formality without losing impact.',
  luxury:
    'Refined, restrained, confident. Quality of materials and craftsmanship. Never use words like "amazing" or "incredible".',
  curiosity:
    'Open a loop. Imply more without revealing all. Make the reader want to click to learn the rest.',
};

// ─────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      originalText?: string;
      kind?: 'headline' | 'cta' | 'body';
      tone?: 'urgent' | 'authority' | 'casual' | 'luxury' | 'curiosity';
      vertical?: string;
      angle?: string;
      framework?: string;
      locale?: 'en' | 'es';
    };

    if (!body.originalText || !body.tone) {
      return NextResponse.json(
        { error: 'originalText and tone are required' },
        { status: 400 },
      );
    }

    if (!serverEnv.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Rewriter unavailable (ANTHROPIC_API_KEY missing)' },
        { status: 500 },
      );
    }

    const kind = body.kind ?? 'headline';
    const verticalHint =
      VERTICAL_VOICE[body.vertical ?? 'other'] ?? VERTICAL_VOICE['other'];
    const toneHint =
      TONE_INSTRUCTIONS[body.tone] ?? TONE_INSTRUCTIONS['authority'];

    // Length constraint by kind
    const lengthGuide =
      kind === 'cta'
        ? '2-4 words. Action verb. Never end with period.'
        : kind === 'headline'
        ? '5-10 words. Punchy. No quotation marks.'
        : '12-20 words. Sentence form. Conversational.';

    const localeNote =
      body.locale === 'es'
        ? 'Write in Spanish. Use natural Spanish marketing voice — never literal English translations.'
        : 'Write in English.';

    const systemPrompt = `You are a senior copywriter at a top-tier creative agency.
You rewrite ad copy with surgical precision — every word earns its place.
You understand vertical-specific voice and never default to generic marketing speak.

VERTICAL VOICE: ${verticalHint}

TONE TO HIT: ${toneHint}

LENGTH: ${lengthGuide}

LANGUAGE: ${localeNote}

OUTPUT FORMAT:
Return EXACTLY 3 variations, one per line, no numbering, no quotes, no preamble.
Just 3 alternatives separated by newlines.`;

    const userPrompt = `Original ${kind}: ${body.originalText}

${body.angle ? `Strategic angle: ${body.angle}` : ''}
${body.framework ? `Hook framework: ${body.framework}` : ''}

Rewrite with the tone: ${body.tone}.
Give me 3 variations.`;

    // ── Call Claude ────────────────────────────────────────────
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Extract text from response
    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n');

    // Parse 3 variations
    const variations = text
      .split('\n')
      .map((line) => line.trim())
      // Remove leading numbering, dashes, quotes
      .map((line) => line.replace(/^[\d.\-•*"\s]+/, '').replace(/["']$/g, ''))
      .filter((line) => line.length > 0 && line.length < 200)
      .slice(0, 3);

    if (variations.length === 0) {
      return NextResponse.json(
        { error: 'Rewriter returned empty variations' },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, variations });
  } catch (err) {
    console.error('[rewrite-text] error', err);
    return NextResponse.json(
      { error: (err as Error).message ?? 'Rewrite failed' },
      { status: 500 },
    );
  }
}
