import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BodySchema = z.object({
  adImageUrl: z.string().url(),
  brief: z.object({
    copy: z.object({
      headline: z.string(),
      subheadline: z.string().default(''),
      cta: z.string(),
    }),
    preset: z.enum(['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo']),
    aspectRatio: z.enum(['9:16', '1:1', '4:5', '16:9']),
  }),
});

export type AuditIssue = {
  category: 'legibility' | 'cta' | 'logo' | 'invented-text' | 'mobile' | 'composition' | 'brand';
  severity: 'critical' | 'warning' | 'minor';
  description: string;
};

export type AuditResult = {
  passed: boolean;
  score: number; // 0-100
  issues: AuditIssue[];
  suggestedFix: 'regenerate-base' | 'recompose' | 'edit-copy' | 'none';
  reasoning: string;
};

const SYSTEM_PROMPT = `You are a strict ad quality auditor. Analyze the provided ad image against the brief.

Return ONLY valid JSON — no markdown, no preamble.

Audit checklist:
1. legibility: Is the headline text readable within 1 second? Contrast sufficient?
2. cta: Is the CTA button clearly visible and prominent?
3. logo: If a logo is present, is it clean and well-placed (not cropped, not blurry)?
4. invented-text: Does the BASE IMAGE contain garbled/invented words, fake logos, or AI-generated text artifacts? (Common AI failure mode)
5. mobile: Will this work on a small mobile screen? Text big enough?
6. composition: Visual hierarchy clear? Eye flows naturally?
7. brand: Does it match the preset style (luxury-minimal vs aggressive etc)?

Severity:
- critical: ad is unusable, MUST regenerate
- warning: noticeable issue, should fix
- minor: cosmetic, optional fix

suggestedFix:
- "regenerate-base": invented text in image, bad composition → need new base image
- "recompose": text overlay issues, layout problems → recompose existing base
- "edit-copy": copy is the problem (too long, weak headline)
- "none": ad is good

Score: 0-100 (90+ excellent, 70-89 acceptable, <70 needs work)
passed: true if score >= 70 AND no critical issues

Output strict JSON:
{
  "passed": true,
  "score": 85,
  "issues": [
    { "category": "legibility", "severity": "warning", "description": "..." }
  ],
  "suggestedFix": "none",
  "reasoning": "1-2 sentence summary"
}`;

export async function POST(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  if (!serverEnv.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  const briefContext = `Ad brief:
- Headline: "${body.brief.copy.headline}"
- Subheadline: "${body.brief.copy.subheadline}"
- CTA: "${body.brief.copy.cta}"
- Preset: ${body.brief.preset}
- Format: ${body.brief.aspectRatio}

Audit this ad image against the brief and return the JSON audit result.`;

  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  try {
    // Convert image URL to base64 to avoid OpenAI timeout downloading from Supabase
    let imageData: { type: 'image_url'; image_url: { url: string; detail: 'high' } };
    try {
      const imageResponse = await fetch(body.adImageUrl, { signal: AbortSignal.timeout(10000) });
      if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const base64 = imageBuffer.toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
      imageData = {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
      };
    } catch (fetchErr) {
      // Fallback: usar URL directa si no se puede convertir
      console.warn('[ads/audit] Could not convert to base64, using URL:', (fetchErr as Error).message);
      imageData = {
        type: 'image_url',
        image_url: { url: body.adImageUrl, detail: 'high' },
      };
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_completion_tokens: 1000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: briefContext },
            imageData,
          ],
        },
      ],
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let result: AuditResult;
    try {
      result = JSON.parse(clean) as AuditResult;
    } catch {
      return NextResponse.json({ error: 'Failed to parse audit response', raw }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed';
    console.error('[ads/audit] failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
