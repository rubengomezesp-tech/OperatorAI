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
  preset: 'luxury-minimal' | 'aggressive' | 'clean-conversion' | 'product-demo';
  aspectRatio: '9:16' | '1:1' | '4:5' | '16:9';
  copy: AdCopy;
  visualPrompt: string;
};

const SYSTEM_PROMPT = `You are an elite ad creative director. Your job is to generate a precise advertising brief from user input and asset analysis.

Return ONLY a valid JSON object — no markdown, no preamble, no explanation.

Rules:
- headline: MAX 6 words, punchy, uppercase
- subheadline: MAX 12 words, direct benefit
- cta: MAX 4 words, action verb first
- concept: 1 central idea, MAX 8 words
- visualPrompt: describe ONLY the background/atmosphere/lighting for image generation — NO text, NO logos, NO people faces. MAX 30 words.
- No generic phrases like "Transform your business"

Presets:
- luxury-minimal: dark background, gold accents, negative space, aspirational
- aggressive: high contrast, bold typography, intense energy, urgency
- clean-conversion: app mockup focus, white/light, clear hierarchy, Meta Ads style
- product-demo: product/screenshot center, functional, benefit-driven

Response format (strict JSON):
{
  "objective": "signup",
  "audience": "...",
  "pain": "...",
  "concept": "...",
  "preset": "luxury-minimal",
  "aspectRatio": "9:16",
  "copy": {
    "headline": "STOP GUESSING. START WINNING.",
    "subheadline": "AI that builds your campaigns in seconds",
    "cta": "START FREE →"
  },
  "visualPrompt": "dark studio background, dramatic golden rim lighting, cinematic depth of field, premium atmosphere"
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

  // Build context block
  const contextParts: string[] = [`User request: "${userPrompt}"`];

  if (brandContext?.brand_name) {
    contextParts.push(`Brand: ${brandContext.brand_name}`);
  }
  if (brandContext?.description) {
    contextParts.push(`Brand description: ${brandContext.description}`);
  }
  if (brandContext?.vibe) {
    contextParts.push(`Brand tone: ${brandContext.vibe}`);
  }
  if (assetAnalysis?.overallStyle) {
    contextParts.push(`Visual style detected: ${assetAnalysis.overallStyle}`);
  }
  if (assetAnalysis?.recommendedPreset) {
    contextParts.push(`Suggested preset: ${assetAnalysis.recommendedPreset}`);
  }
  if (assetAnalysis?.assets?.length) {
    const assetSummary = assetAnalysis.assets
      .map(a => `${a.type} (${a.style}, colors: ${a.dominantColors.join(', ')})`)
      .join('; ');
    contextParts.push(`Assets provided: ${assetSummary}`);
  }

  const userMessage = contextParts.join('\n');

  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
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
