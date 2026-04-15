import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VOICE_OPTIONS = ['alloy','ash','ballad','coral','echo','fable','onyx','nova','sage','shimmer'] as const;
const BodySchema = z.object({
  text: z.string().min(1).max(4000),
  voice: z.enum(VOICE_OPTIONS).optional().default('nova'),
  speed: z.number().min(0.5).max(2.0).optional().default(1.0),
});

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    if (!serverEnv.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  }
  return client;
}

export async function POST(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  try {
    const openai = getClient();
    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: parsed.data.voice,
      input: parsed.data.text,
      speed: parsed.data.speed,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(buffer.length),
      },
    });
  } catch (e) {
    console.error('[voice.speak] failed:', e);
    const msg = e instanceof Error ? e.message : 'TTS failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
