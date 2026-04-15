import { NextResponse, type NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

  const form = await req.formData();
  const file = form.get('audio') as File | null;
  const language = (form.get('language') as string | null) || undefined;

  if (!file) {
    return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Audio too large (max 25MB)' }, { status: 400 });
  }

  try {
    const openai = getClient();
    const result = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language,
      response_format: 'json',
      temperature: 0.2,
    });
    return NextResponse.json({ text: result.text });
  } catch (e) {
    console.error('[voice.transcribe] failed:', e);
    const msg = e instanceof Error ? e.message : 'Transcription failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
