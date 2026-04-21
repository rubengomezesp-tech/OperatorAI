import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * REFERENCE COMPOSER — CLASSIFY ONLY
 * Sends images to Claude Vision → returns classification
 * Does NOT generate any new image
 */
export async function POST(req: NextRequest) {
  try {
    const { imageUrls } = await req.json();
    if (!imageUrls?.length) return NextResponse.json({ error: 'No images' }, { status: 400 });

    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not auth' }, { status: 401 });

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

    // Build image blocks for Claude Vision
    const blocks: any[] = [];
    for (let i = 0; i < Math.min(imageUrls.length, 10); i++) {
      try {
        const res = await fetch(imageUrls[i]);
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = res.headers.get('content-type') || 'image/png';
        const validMime = ['image/jpeg','image/png','image/gif','image/webp'].includes(mime) ? mime : 'image/png';
        blocks.push({ type: 'text', text: 'Image ' + (i+1) + ':' });
        blocks.push({ type: 'image', source: { type: 'base64', media_type: validMime, data: buf.toString('base64') } });
      } catch {
        blocks.push({ type: 'text', text: 'Image ' + (i+1) + ': [failed to load]' });
      }
    }

    blocks.push({
      type: 'text',
      text: `Classify each image. Respond ONLY with JSON (no markdown):
{"images":[{"index":1,"type":"logo|product|ui|screenshot|lifestyle|support","width":"narrow|medium|wide","description":"10 words max"}]}
Types: logo=brand logo, product=physical/digital product, ui=app interface, screenshot=screen capture, lifestyle=lifestyle photo, support=other visual asset.`
    });

    const res = await claude.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 400,
      messages: [{ role: 'user', content: blocks }],
    });

    let classification = { images: [] as any[] };
    try {
      const text = res.content[0].type === 'text' ? res.content[0].text : '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) classification = JSON.parse(match[0]);
    } catch {}

    return NextResponse.json({ ok: true, classification });
  } catch (e) {
    console.error('[compose]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
