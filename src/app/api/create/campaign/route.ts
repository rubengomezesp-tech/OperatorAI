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
  composedImageUrl: z.string().optional(),
  objective: z.string().optional(),
  priority: z.enum(['fast', 'balanced', 'exact']).default('balanced'),
  duration: z.number().min(3).max(15).default(15),
  format: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
});

async function generateCopy(objective: string): Promise<{ hook: string; message: string; cta: string; headline: string }> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      messages: [{ role: 'user', content: `Generate ad copy for: "${objective || 'Premium brand ad'}". Respond ONLY with JSON: {"hook":"max 6 words","message":"max 15 words","cta":"max 4 words","headline":"max 8 words"}` }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) { console.error('[copy]', e); }
  return { hook: 'See what we built', message: 'The future of your brand starts here', cta: 'Start Free', headline: 'Your brand, elevated' };
}

async function generateVideo(
  model: string,
  prompt: string,
  duration: number,
  startImage?: string,
  referenceImages?: string[],
  aspect?: string,
): Promise<string> {
  const Replicate = (await import('replicate')).default;
  const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });

  const input: Record<string, any> = {
    prompt,
    duration: Math.min(Math.max(duration, 3), 15),
    aspect_ratio: aspect || '9:16',
  };

  // Kling V3 normal: start_image only
  if (startImage && !model.includes('omni')) {
    input.start_image = startImage;
  }

  // Kling Omni: supports reference_images array
  if (model.includes('omni')) {
    if (startImage) input.start_image = startImage;
    if (referenceImages && referenceImages.length > 0) {
      // Omni accepts reference images for style/character consistency
      input.reference_images = referenceImages.slice(0, 4).join('|');
    }
  }

  console.log('[video] Model:', model, 'Duration:', input.duration, 'Refs:', referenceImages?.length || 0);
  const output = await client.run(model as `${string}/${string}`, { input });

  if (typeof output === 'string') return output;
  if (output instanceof URL) return output.toString();
  if (output && typeof output === 'object') {
    const o = output as any;
    if (typeof o.url === 'function') return await o.url();
    if (o.url) return String(o.url);
    if (o.href) return String(o.href);
    if (o.toString() !== '[object Object]') return o.toString();
    if (Array.isArray(output) && output[0]) {
      if (typeof output[0] === 'string') return output[0];
      if (output[0]?.url) return String(output[0].url);
    }
  }
  throw new Error('Could not extract video URL');
}

async function persistToStorage(svc: any, orgId: string, tempUrl: string, id: string): Promise<string> {
  try {
    const res = await fetch(tempUrl, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return tempUrl;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 10000) return tempUrl;
    const head = buffer.toString('utf8', 0, 50);
    if (head.includes('"error"') || head.includes('<html')) return tempUrl;

    const path = orgId + '/' + id + '.mp4';
    await svc.storage.from('videos').upload(path, buffer, { contentType: 'video/mp4', cacheControl: '31536000', upsert: true });
    const { data } = svc.storage.from('videos').getPublicUrl(path);
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

    // 1. Copy
    const copy = await generateCopy(body.objective || '');

    // 2. Route model
    const route = routeVideoModel({
      refCount: body.imageUrls.length,
      duration: body.duration,
      priority: body.priority,
    });

    // 3. Build prompt
    const prompt = [
      copy.hook + '.',
      copy.message + '.',
      body.objective || 'Premium brand advertisement.',
      'Cinematic, smooth camera movement, professional lighting, premium commercial quality.',
    ].join(' ');

    // 4. Determine images to send
    const startImage = body.composedImageUrl || body.imageUrls[0];

    // Exact mode: send only 2-4 most relevant refs (not all)
    // Composed canvas is the primary visual. Refs add consistency, not override.
    let refImages: string[] | undefined;
    if (route.supportsMultiRef && body.imageUrls.length > 1) {
      refImages = body.imageUrls
        .filter((url: string) => url !== body.composedImageUrl)
        .slice(0, 4);
    }

    // 5. Generate video
    const tempUrl = await generateVideo(route.model, prompt, route.duration, startImage, refImages, body.format);

    // 6. Persist
    const videoId = crypto.randomUUID();
    const permanentUrl = await persistToStorage(svc, orgId, tempUrl, videoId);

    // 7. Save to DB
    await (svc as any).from('videos').insert({
      id: videoId, org_id: orgId, user_id: user.id,
      prompt: prompt.slice(0, 500), model: route.model,
      aspect_ratio: body.format, duration_seconds: route.duration,
      status: 'completed', storage_path: permanentUrl,
      created_at: new Date().toISOString(), completed_at: new Date().toISOString(),
    }).catch((e: any) => console.error('[db]', e));

    // 8. Push
    try {
      const { sendPushNotification } = await import('@/lib/push');
      await sendPushNotification(user.id, 'Campaign ready', 'Your ad is ready.', '/create');
    } catch {}

    return NextResponse.json({ ok: true, campaign: { copy, video: { id: videoId, url: permanentUrl, duration: route.duration }, model: route.provider } });
  } catch (e) {
    console.error('[campaign]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
