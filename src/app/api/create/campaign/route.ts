import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { routeVideoModel, type Priority } from '@/lib/model-router';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 300;

const Schema = z.object({
  imageUrls: z.array(z.string()).min(1),
  objective: z.string().optional(),
  priority: z.enum(['fast', 'balanced', 'exact']).default('balanced'),
  duration: z.number().min(3).max(15).default(15),
  format: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
});

async function generateCopy(objective: string, imageCount: number): Promise<{ hook: string; message: string; cta: string }> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Generate ad copy for: "${objective || 'Premium brand ad'}". The ad uses ${imageCount} product/brand images. Respond ONLY with JSON, no markdown: {"hook":"max 6 words, attention grabber","message":"max 12 words, value proposition","cta":"max 4 words, action button"}`
      }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) { console.error('[copy]', e); }
  return { hook: 'See what we built', message: 'The future of your brand starts here', cta: 'Start Free' };
}

async function generateVideo(model: string, prompt: string, duration: number, imageUrl?: string, aspect?: string): Promise<string> {
  const Replicate = (await import('replicate')).default;
  const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });

  const input: Record<string, any> = {
    prompt,
    duration: Math.min(Math.max(duration, 3), 15),
    aspect_ratio: aspect || '9:16',
  };

  if (imageUrl) {
    input.start_image = imageUrl;
  }

  console.log('[video] Generating with', model, 'duration:', input.duration);
  const output = await client.run(model as `${string}/${string}`, { input });

  // Extract URL from any format
  if (typeof output === 'string') return output;
  if (output instanceof URL) return output.toString();
  if (output && typeof output === 'object') {
    const o = output as any;
    if (typeof o.url === 'function') return await o.url();
    if (o.url) return String(o.url);
    if (o.href) return String(o.href);
    if (o.toString() !== '[object Object]') return o.toString();
    if (Array.isArray(output) && output[0]) {
      const f = output[0];
      if (typeof f === 'string') return f;
      if (f?.url) return String(f.url);
    }
  }
  throw new Error('Could not extract video URL');
}

async function persistToStorage(svc: any, orgId: string, tempUrl: string, id: string, type: 'video' | 'image'): Promise<string> {
  try {
    const res = await fetch(tempUrl, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return tempUrl;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 10000) return tempUrl;

    // Check it's not an error page
    const head = buffer.toString('utf8', 0, 50);
    if (head.includes('"error"') || head.includes('<html')) return tempUrl;

    const bucket = type === 'video' ? 'videos' : 'image-outputs';
    const ext = type === 'video' ? 'mp4' : 'png';
    const path = orgId + '/' + id + '.' + ext;

    await svc.storage.from(bucket).upload(path, buffer, {
      contentType: type === 'video' ? 'video/mp4' : 'image/png',
      cacheControl: '31536000',
      upsert: true,
    });

    const { data } = svc.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || tempUrl;
  } catch { return tempUrl; }
}

export async function POST(req: NextRequest) {
  try {
    const body = Schema.parse(await req.json());

    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    const { orgId } = await resolveOrgContext(svc, user.id);

    // Step 1: Generate copy
    const copy = await generateCopy(body.objective || '', body.imageUrls.length);
    console.log('[campaign] Copy:', copy);

    // Step 2: Route model
    const route = routeVideoModel({
      refCount: body.imageUrls.length,
      duration: body.duration,
      priority: body.priority,
      hasProduct: true,
    });
    console.log('[campaign] Route:', route.provider, route.mode, route.duration);

    // Step 3: Build video prompt
    const videoPrompt = [
      copy.hook + '.',
      copy.message + '.',
      body.objective || 'Premium brand advertisement.',
      'Cinematic, professional, smooth camera movement, premium lighting, high-end commercial quality.',
      'Format: vertical 9:16, modern, luxurious aesthetic.',
    ].join(' ');

    // Step 4: Generate video
    const firstImage = body.imageUrls[0];
    const tempVideoUrl = await generateVideo(
      route.model,
      videoPrompt,
      route.duration,
      route.mode === 'image_to_video' ? firstImage : undefined,
      body.format,
    );

    // Step 5: Persist
    const videoId = crypto.randomUUID();
    const permanentUrl = await persistToStorage(svc, orgId, tempVideoUrl, videoId, 'video');

    // Step 6: Save to DB
    await (svc as any).from('videos').insert({
      id: videoId,
      org_id: orgId,
      user_id: user.id,
      prompt: videoPrompt.slice(0, 500),
      model: route.model,
      aspect_ratio: body.format,
      duration_seconds: route.duration,
      status: 'completed',
      storage_path: permanentUrl,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).then(() => {}).catch((e: any) => console.error('[db]', e));

    // Step 7: Push notification
    try {
      const { sendPushNotification } = await import('@/lib/push');
      await sendPushNotification(user.id, 'Campaign ready', 'Your ad video is ready to preview.', '/create');
    } catch {}

    return NextResponse.json({
      ok: true,
      campaign: {
        copy,
        video: { id: videoId, url: permanentUrl, duration: route.duration },
        model: route.provider,
      },
    });
  } catch (e) {
    console.error('[campaign]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
