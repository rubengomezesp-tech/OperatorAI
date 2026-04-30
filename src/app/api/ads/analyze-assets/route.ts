import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BodySchema = z.object({
  images: z
    .array(
      z.object({
        base64: z.string().min(1),
        mimeType: z.string().default('image/png'),
      }),
    )
    .min(1)
    .max(5),
});

export type AssetAnalysis = {
  type: 'logo' | 'screenshot' | 'avatar' | 'background' | 'unknown';
  dominantColors: string[];
  style: 'luxury' | 'aggressive' | 'minimalist' | 'tech' | 'dark' | 'vibrant' | 'neutral';
  hasText: boolean;
  suggestedFormat: '9:16' | '1:1' | '4:5' | '16:9';
  description: string;
};

export type AnalyzeAssetsResponse = {
  assets: AssetAnalysis[];
  recommendedPreset: 'luxury-minimal' | 'aggressive' | 'clean-conversion' | 'product-demo';
  overallStyle: string;
};

const SYSTEM_PROMPT = `You are a visual asset analyzer for an AI ad director system.
Analyze each image and return ONLY a valid JSON object — no markdown, no preamble.

For each image determine:
- type: "logo" | "screenshot" | "avatar" | "background" | "unknown"
- dominantColors: array of 2-4 hex codes (most prominent colors)
- style: "luxury" | "aggressive" | "minimalist" | "tech" | "dark" | "vibrant" | "neutral"
- hasText: boolean — does the image contain text/typography?
- suggestedFormat: best ad format for this asset: "9:16" | "1:1" | "4:5" | "16:9"
- description: 1 sentence max describing the asset

Then provide:
- recommendedPreset: "luxury-minimal" | "aggressive" | "clean-conversion" | "product-demo"
- overallStyle: 1 sentence summarizing the visual identity

Response format (strict JSON):
{
  "assets": [ { "type": "...", "dominantColors": ["#000000"], "style": "...", "hasText": true, "suggestedFormat": "1:1", "description": "..." } ],
  "recommendedPreset": "luxury-minimal",
  "overallStyle": "..."
}`;

export async function POST(req: NextRequest) {
  // Auth
  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Parse body
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { images } = parsed.data;

  if (!serverEnv.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  // Build vision message content
  const content: OpenAI.Chat.ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `Analyze these ${images.length} image(s) and return the JSON as instructed.`,
    },
    ...images.map(
      (img): OpenAI.Chat.ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`,
          detail: 'high',
        },
      }),
    ),
  ];

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
      temperature: 0.1, // deterministic for analysis
    });

    const raw = response.choices[0]?.message?.content ?? '';

    // Strip potential markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();

    let result: AnalyzeAssetsResponse;
    try {
      result = JSON.parse(clean) as AnalyzeAssetsResponse;
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse vision response', raw },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Vision API error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
