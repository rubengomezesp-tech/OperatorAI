import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 });
    if (!serverEnv.OPENAI_API_KEY) return NextResponse.json({ error: 'TTS not configured' }, { status: 500 });

    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

    const mp3 = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice || 'nova',
      input: text.substring(0, 4096),
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (e) {
    console.error('[tts]', e);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
