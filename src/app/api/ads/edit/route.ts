import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { serverEnv } from '@/lib/env';
import {
  renderAndUploadAd,
  urlToDataUrl,
  type AdPreset,
} from '@/lib/ads/compose/renderer';
import type { AdAspectRatio } from '@/lib/ads/compose/dimensions';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PresetEnum = z.enum(['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo']);
const AspectEnum = z.enum(['9:16', '1:1', '4:5', '16:9']);

const BriefSchema = z.object({
  copy: z.object({
    headline: z.string(),
    subheadline: z.string().default(''),
    cta: z.string(),
  }),
  preset: PresetEnum,
  aspectRatio: AspectEnum,
  visualPrompt: z.string().optional(),
});

const BodySchema = z.object({
  currentBrief: BriefSchema,
  currentBaseImageUrl: z.string().url(),
  logoUrl: z.string().url().optional(),
  userMessage: z.string().min(1).max(500),
});

type AdBrief = z.infer<typeof BriefSchema>;

const SYSTEM_PROMPT = `You are an ad editing intent classifier. Given the current ad brief and a user edit request, determine what changes are needed.

Return ONLY valid JSON — no markdown, no preamble.

changeType options:
- "copy": only headline/subheadline/cta text changes
- "preset": visual style change (luxury-minimal, aggressive, clean-conversion, product-demo)
- "aspectRatio": format change (9:16, 1:1, 4:5, 16:9)
- "visual": background image needs regeneration (lighting, composition, scene change)
- "mixed": combination of above

needsImageRegen: true ONLY if the background image must be regenerated. Copy/preset/aspect changes alone do NOT need regen.

Examples:
"más luxury" → preset: luxury-minimal, needsImageRegen: false (preset change recomposes existing image)
"CTA más fuerte" → copy.cta updated, needsImageRegen: false
"centra el símbolo" → needsImageRegen: true (composition change requires new image)
"fondo más oscuro" → needsImageRegen: true (visual change)
"hazlo story" → aspectRatio: 9:16, needsImageRegen: false
"texto más corto y agresivo" → copy + preset both update, needsImageRegen: false

Output strict JSON:
{
  "changeType": "copy" | "preset" | "aspectRatio" | "visual" | "mixed",
  "needsImageRegen": false,
  "updatedBrief": {
    "copy": { "headline": "...", "subheadline": "...", "cta": "..." },
    "preset": "luxury-minimal",
    "aspectRatio": "9:16",
    "visualPrompt": "..."
  },
  "explanation": "1 short sentence describing what changed"
}

The updatedBrief MUST contain the FULL brief (changed + unchanged fields).`;

interface EditDecision {
  changeType: 'copy' | 'preset' | 'aspectRatio' | 'visual' | 'mixed';
  needsImageRegen: boolean;
  updatedBrief: AdBrief;
  explanation: string;
}

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

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  // 1) Classify the edit
  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  const userContext = JSON.stringify({
    currentBrief: body.currentBrief,
    userRequest: body.userMessage,
  });

  let decision: EditDecision;
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContext },
      ],
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();
    decision = JSON.parse(clean) as EditDecision;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Edit classification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // 2) If image regen needed → return hint, frontend handles regen pipeline
  if (decision.needsImageRegen) {
    return NextResponse.json({
      action: 'regenerate-needed',
      updatedBrief: decision.updatedBrief,
      explanation: decision.explanation,
      regenerateHint: {
        visualPrompt: decision.updatedBrief.visualPrompt ?? body.currentBrief.visualPrompt ?? '',
        preset: decision.updatedBrief.preset,
        aspectRatio: decision.updatedBrief.aspectRatio,
      },
    });
  }

  // 3) Recompose using existing base image
  try {
    const [baseImageDataUrl, logoDataUrl] = await Promise.all([
      urlToDataUrl(body.currentBaseImageUrl),
      body.logoUrl ? urlToDataUrl(body.logoUrl) : Promise.resolve(undefined),
    ]);

    const result = await renderAndUploadAd({
      input: {
        baseImageDataUrl,
        logoDataUrl,
        copy: {
          headline: decision.updatedBrief.copy.headline,
          subheadline: decision.updatedBrief.copy.subheadline ?? '',
          cta: decision.updatedBrief.copy.cta,
        },
        preset: decision.updatedBrief.preset as AdPreset,
        aspectRatio: decision.updatedBrief.aspectRatio as AdAspectRatio,
      },
      svc,
      orgId,
      filePrefix: 'edited',
    });

    return NextResponse.json({
      action: 'composed',
      url: result.url,
      storagePath: result.storagePath,
      width: result.width,
      height: result.height,
      updatedBrief: decision.updatedBrief,
      explanation: decision.explanation,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Recompose failed';
    console.error('[ads/edit] recompose failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
