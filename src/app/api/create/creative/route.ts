import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 180;

/**
 * CREATIVE MODE — Cinematic image generation
 * Uses Claude Vision to understand uploaded images,
 * then builds a premium art-directed prompt for Flux to generate
 * a high-end cinematic composition (NOT a canvas layout).
 */
export async function POST(req: NextRequest) {
  try {
    const { imageUrls, objective, aspectRatio } = await req.json();
    if (!imageUrls?.length) return NextResponse.json({ error: 'No images' }, { status: 400 });

    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not auth' }, { status: 401 });

    // 1. Claude Vision builds art direction from references
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

    const blocks: any[] = [];
    for (let i = 0; i < Math.min(imageUrls.length, 6); i++) {
      try {
        const res = await fetch(imageUrls[i]);
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = res.headers.get('content-type') || 'image/png';
        const validMime = ['image/jpeg','image/png','image/gif','image/webp'].includes(mime) ? mime : 'image/png';
        blocks.push({ type: 'text', text: 'Reference ' + (i+1) + ':' });
        blocks.push({ type: 'image', source: { type: 'base64', media_type: validMime, data: buf.toString('base64') } });
      } catch {}
    }

    blocks.push({
      type: 'text',
      text: `You are a senior art director. Based on these references, build a cinematic ad composition for: "${objective || 'premium brand'}". 

Write ONE detailed art direction prompt for an AI image generator. Focus on:
- Subject and composition (what's in the frame)
- Lighting (cinematic, dramatic, soft glow, rim light)
- Depth of field and bokeh
- Color palette (match the brand from references)
- Motion blur, light streaks, atmospheric effects
- Camera angle and framing
- Mood and emotion
- Commercial photography style references (Apple ads, Nike, luxury brands)

DO NOT include text in the image. No words. No logos with letters.

Respond ONLY with JSON (no markdown):
{
  "prompt": "detailed cinematic art direction, 80-150 words",
  "palette": "hex colors description",
  "mood": "2-3 words"
}`
    });

    const artDirection = await claude.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 800,
      messages: [{ role: 'user', content: blocks }],
    });

    let direction: any = {};
    try {
      const text = artDirection.content[0].type === 'text' ? artDirection.content[0].text : '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) direction = JSON.parse(match[0]);
    } catch {}

    const basePrompt = direction.prompt || 'Luxury cinematic advertisement, black and gold color palette, dramatic lighting, depth of field, premium commercial photography, high-end brand aesthetic';

    const fullPrompt = [
      basePrompt,
      'No text, no letters, no words, no logos with text, text-free composition.',
      'Premium quality, 4K, cinematic, award-winning commercial photography.',
    ].join(' ');

    // 2. Generate image with Flux (using references for style)
    const aspectMap: Record<string, string> = { '9:16': '9:16', '1:1': '1:1', '4:5': '4:5' };
    const imgRes = await fetch(new URL('/api/images/generate', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: req.headers.get('cookie') || '' },
      body: JSON.stringify({
        prompt: fullPrompt,
        preset: 'editorial',
        aspectRatio: aspectMap[aspectRatio] || '9:16',
        enhance: false,
        imageModel: 'flux-2-pro',
        referenceUrls: imageUrls.slice(0, 4),
      }),
    });
    const imgData = await imgRes.json();
    if (!imgRes.ok) throw new Error(imgData.error || 'Image generation failed');

    const imageUrl = imgData.image?.display_urls?.[0] || imgData.image?.url || null;

    return NextResponse.json({
      ok: true,
      imageUrl,
      artDirection: direction,
      prompt: fullPrompt.slice(0, 500),
    });
  } catch (e) {
    console.error('[creative]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
