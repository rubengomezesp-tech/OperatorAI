import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { serverEnv } from '@/lib/env';
import { sendPushNotification } from '@/lib/push';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BodySchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  aspectRatio: z.enum(['16:9', '9:16']).optional(),
  duration: z.number().optional(),
  referenceBase64: z.string().optional(),
  referenceMimeType: z.string().optional(),
});

/** Download video from temp URL and upload to Supabase Storage */
async function persistVideo(svc: any, orgId: string, tempUrl: string, videoId: string): Promise<string> {
  // Download video bytes
  const res = await fetch(tempUrl);
  if (!res.ok) throw new Error('Failed to download video: ' + res.status);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'video/mp4';
  const ext = contentType.includes('webm') ? 'webm' : 'mp4';

  // Upload to Supabase Storage
  const storagePath = orgId + '/' + videoId + '.' + ext;
  const { error } = await svc.storage
    .from('video-outputs')
    .upload(storagePath, buffer, {
      contentType,
      cacheControl: '31536000',
      upsert: true,
    });

  if (error) {
    console.error('[video-storage]', error);
    // Return temp URL as fallback
    return tempUrl;
  }

  // Get permanent public URL
  const { data } = svc.storage.from('video-outputs').getPublicUrl(storagePath);
  return data?.publicUrl || tempUrl;
}

async function generateWithReplicate(prompt: string): Promise<string> {
  const Replicate = (await import('replicate')).default;
  const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });
  const output = await client.run('minimax/video-01', { input: { prompt, prompt_optimizer: true } });
  if (typeof output === 'string') return output;
  if (output && typeof output === 'object' && 'url' in (output as any)) return String((output as any).url);
  throw new Error('No video URL from Replicate');
}

async function generateWithVeo(prompt: string, model: string, aspect: string, duration: number, refBase64?: string, refMime?: string): Promise<string> {
  const { generateVideo, getOperationStatus } = await import('@/features/video/server/veo-client');

  const op = await generateVideo({
    prompt,
    model: model as any,
    aspectRatio: aspect as any,
    durationSeconds: duration as any,
    imageBytes: refBase64,
    imageMimeType: refMime,
  });

  for (let i = 0; i < 48; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const status = await getOperationStatus(op.operationName);
    if (status.done) {
      if (status.videoUri) return status.videoUri;
      if (status.error) throw new Error('Veo: ' + status.error);
      throw new Error('Veo completed but no video URL');
    }
  }
  throw new Error('Video generation timed out');
}

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    let orgId: string;
    try { orgId = (await resolveOrgContext(svc, user.id)).orgId; } catch {
      return NextResponse.json({ error: 'No workspace' }, { status: 403 });
    }

    const started = Date.now();
    const isReplicate = body.model === 'minimax-video-01';
    const videoId = crypto.randomUUID();

    // Step 1: Generate video (temp URL)
    let tempUrl: string;
    if (isReplicate) {
      tempUrl = await generateWithReplicate(body.prompt);
    } else {
      tempUrl = await generateWithVeo(
        body.prompt,
        body.model || 'veo-3.1-fast-generate-preview',
        body.aspectRatio || '16:9',
        body.duration || 8,
        body.referenceBase64,
        body.referenceMimeType,
      );
    }

    // Step 2: Download and save to Supabase Storage (permanent)
    const permanentUrl = await persistVideo(svc, orgId, tempUrl, videoId);

    const latencyMs = Date.now() - started;

    // Step 3: Save to DB with permanent URL
    const { error: dbError } = await (svc as any).from('videos').insert({
      id: videoId,
      org_id: orgId,
      user_id: user.id,
      prompt: body.prompt,
      model: body.model || 'veo-3.1-fast-generate-preview',
      aspect_ratio: body.aspectRatio || '16:9',
      duration_seconds: isReplicate ? 15 : (body.duration || 8),
      status: 'completed',
      video_url: permanentUrl,
      cost_usd: isReplicate ? 0.05 : 0.08,
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('[video-db]', dbError.message);
      // Return video even if DB fails
      return NextResponse.json({
        ok: true,
        video: { id: videoId, url: permanentUrl, latencyMs },
        warning: 'Video saved to storage but DB record failed: ' + dbError.message,
      });
    }

    // Send push notification
    sendPushNotification(user.id, 'Video ready', 'Your video has been generated and saved.', '/studio/video').catch(() => {});

    return NextResponse.json({ ok: true, video: { id: videoId, url: permanentUrl, latencyMs } });
  } catch (e) {
    console.error('[video-generate]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
