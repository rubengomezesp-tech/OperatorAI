import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BodySchema = z.object({
  userPrompt: z.string().min(1).max(2000),
  assetAnalysis: z.object({
    assets: z.array(z.object({
      type: z.string(),
      dominantColors: z.array(z.string()),
      style: z.string(),
      hasText: z.boolean(),
      suggestedFormat: z.string(),
      description: z.string(),
    })).optional(),
    recommendedPreset: z.string().optional(),
    overallStyle: z.string().optional(),
  }).optional(),
  brandContext: z.object({
    brand_name: z.string().optional(),
    description: z.string().optional(),
    vibe: z.string().optional(),
  }).optional(),
});

export type AdCopy = {
  headline: string;
  subheadline: string;
  cta: string;
};

export type AdBrief = {
  objective: 'free-trial' | 'signup' | 'download' | 'sale' | 'awareness';
  audience: string;
  pain: string;
  concept: string;
  angle: 'pain' | 'aspiration' | 'authority' | 'speed' | 'simplicity' | 'control' | 'exclusivity';
  tone: 'aggressive' | 'minimal' | 'luxury' | 'direct' | 'technical' | 'emotional' | 'dominant';
  composition: string;
  preset: 'luxury-minimal' | 'aggressive' | 'clean-conversion' | 'product-demo';
  aspectRatio: '9:16' | '1:1' | '4:5' | '16:9';
  copy: AdCopy;
  alternativeCopies: AdCopy[];
  visualPrompt: string;
};

const SYSTEM_PROMPT = `You are Operator AI Creative Engine.
You do NOT generate images. You create ads that CONVERT.

Always act as: creative director + senior designer + direct-response marketer.
Detect user language (Spanish/English) and write copy in THAT language.

═══════ 1. PICK A FRESH ANGLE (don't default to "aspiration") ═══════
Choose exactly ONE — randomize when no signal:
  pain        — name the user's frustration directly
  aspiration  — paint the desired future state
  authority   — assert dominance / brand strength
  speed       — emphasize how fast it works
  simplicity  — emphasize ease, no effort
  control     — give the user power / mastery
  exclusivity — make them feel selected / elite (only IF brand is luxury)

═══════ 2. PICK A TONE ═══════
  aggressive | minimal | luxury | direct | technical | emotional | dominant

═══════ 3. PICK A COMPOSITION HINT ═══════
  text-left-visual-right | text-center-visual-bg | visual-hero-text-small
  cta-center | cta-bottom | layout-vertical | layout-split

═══════ 4. COPY RULES — NON-NEGOTIABLE ═══════

1 ad = 1 idea. 1 ad = 1 emotion. 1 ad = 1 action.

HEADLINE (3-6 words MAX):
  - Punchy, specific, written in UPPERCASE
  - Verb-first when possible
  - Use brand name when natural
  - NEVER start with: Embrace, Experience, Elevate, Discover, Unleash, Transform
  - BANNED words: elite, premium, edge, exclusive design, next level, journey

SUBHEADLINE (≤10 words):
  - ONE concrete benefit OR audience-specific hook
  - Reference the actual pain or aspiration
  - NO 3-adjective lists (e.g., "athletic fit, premium quality, exclusive design" ← FORBIDDEN)

CTA (2-3 words). Pick from this approved list (match user language):

  Spanish: PRUÉBALO AHORA | EMPIEZA HOY | CREA TU CAMPAÑA | ACCEDE AHORA |
           ENTRENA AHORA | COMPRA YA | ÚNETE AHORA | DESCÚBRELO

  English: TRY IT NOW | START TODAY | CREATE NOW | GET ACCESS |
           SHOP NOW | START TRAINING | GET YOURS | JOIN NOW

  NEVER USE: Discover now | Learn more | Get started | Click here | Find out more

═══════ 5. GENERATE 3 COPY VARIANTS — pick the strongest ═══════

Always generate 3 distinct copy combinations internally with DIFFERENT angles/tones.
Select the strongest as "copy". Return the other 2 as "alternativeCopies".

═══════ EXAMPLES ═══════

✅ GOOD (Spanish, aggressive control angle):
   { "headline": "DEJA DE PENSAR. EJECUTA.", "subheadline": "Tu IA convierte ideas en campañas reales", "cta": "EMPIEZA HOY" }

✅ GOOD (Spanish, authority tone):
   { "headline": "TU ESTRATEGIA. NUESTRA IA.", "subheadline": "Resultados reales en horas, no en semanas", "cta": "ACCEDE AHORA" }

✅ GOOD (English, speed angle):
   { "headline": "TRAIN HARDER. NO EXCUSES.", "subheadline": "Built for athletes who refuse to quit", "cta": "SHOP NOW" }

❌ REJECTED (banned words, generic, 3-adjective list):
   { "headline": "EMBRACE THE ELITE EDGE", "subheadline": "Athletic fit, premium quality, exclusive design", "cta": "Get started" }

═══════ 6. PRESET MAPPING ═══════
Map tone → preset:
  luxury        → luxury-minimal
  aggressive/dominant → aggressive
  direct/minimal → clean-conversion
  technical     → product-demo

═══════ 7. VISUAL PROMPT ═══════
Background/atmosphere only. NO text, NO logos. MAX 30 words.
The user's reference image (if any) will be the central subject — describe what to put AROUND it (lighting, atmosphere).

═══════ OUTPUT — strict JSON, no markdown ═══════

{
  "angle": "control",
  "tone": "aggressive",
  "composition": "text-center-visual-bg",
  "objective": "signup|free-trial|download|sale|awareness",
  "audience": "<specific 1-line>",
  "pain": "<specific 1-line>",
  "concept": "<central idea, ≤8 words>",
  "preset": "luxury-minimal|aggressive|clean-conversion|product-demo",
  "aspectRatio": "9:16|1:1|4:5|16:9",
  "copy": { "headline": "...", "subheadline": "...", "cta": "..." },
  "alternativeCopies": [
    { "headline": "...", "subheadline": "...", "cta": "..." },
    { "headline": "...", "subheadline": "...", "cta": "..." }
  ],
  "visualPrompt": "..."
}`;

export async function POST(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }

  const { userPrompt, assetAnalysis, brandContext } = parsed.data;

  if (!serverEnv.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  // Build context
  const contextParts: string[] = [`User request: "${userPrompt}"`];
  if (brandContext?.brand_name)  contextParts.push(`Brand: ${brandContext.brand_name}`);
  if (brandContext?.description) contextParts.push(`Brand description: ${brandContext.description}`);
  if (brandContext?.vibe)        contextParts.push(`Brand tone: ${brandContext.vibe}`);
  if (assetAnalysis?.overallStyle)      contextParts.push(`Visual style: ${assetAnalysis.overallStyle}`);
  if (assetAnalysis?.recommendedPreset) contextParts.push(`Suggested preset: ${assetAnalysis.recommendedPreset}`);
  if (assetAnalysis?.assets?.length) {
    const summary = assetAnalysis.assets.map(a => `${a.type} (${a.style}, ${a.dominantColors.join(',')})`).join('; ');
    contextParts.push(`Assets: ${summary}`);
  }

  // Random angle hint to break sameness across runs
  const angles = ['pain','aspiration','authority','speed','simplicity','control','exclusivity'];
  const tones = ['aggressive','minimal','luxury','direct','technical','emotional','dominant'];
  const angleHint = angles[Math.floor(Math.random() * angles.length)];
  const toneHint = tones[Math.floor(Math.random() * tones.length)];
  contextParts.push(`\nVARIETY HINT (consider these but choose what fits best): angle=${angleHint}, tone=${toneHint}`);

  const userMessage = contextParts.join('\n');

  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.85, // higher for creativity / variety
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let brief: AdBrief;
    try {
      brief = JSON.parse(clean) as AdBrief;
    } catch {
      return NextResponse.json({ error: 'Failed to parse brief response', raw }, { status: 500 });
    }

    return NextResponse.json(brief);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OpenAI error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
