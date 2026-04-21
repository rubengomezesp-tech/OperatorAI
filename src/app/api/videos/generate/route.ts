import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { generateVideo, getOperationStatus } from '@/features/video/server/veo-client';
import { serverEnv } from '@/lib/env';

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

async function generateWithReplicate(prompt: string): Promise<string> {
  const Replicate = (await import('replicate')).default;
  const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });
  const output = await client.run('minimax/video-01', { input: { prompt, prompt_optimizer: true } });
  if (typeof output === 'string') return output;
  if (output && typeof output === 'object' && 'url' in (output as any)) return String((output as any).url);
  throw new Error('No video URL from Replicate');
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
    let videoUrl = '';
    const isReplicate = body.model === 'minimax-video-01';

    if (isReplicate) {
      // Replicate — longer videos
      videoUrl = await generateWithReplicate(body.prompt);
    } else {
      // Veo — Google's video model
      const op = await generateVideo({
        prompt: body.prompt,
        model: (body.model as any) || 'veo-3.1-fast-generate-preview',
        aspectRatio: body.aspectRatio || '16:9',
        durationSeconds: (body.duration as any) || 8,
        imageBytes: body.referenceBase64,
        imageMimeType: body.referenceMimeType,
      });

      // Poll for result (max 4 min)
      for (let i = 0; i < 48; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const status = await getOperationStatus(op.operationName);
        if (status.done) {
          if (status.videoUri) videoUrl = status.videoUri;
          if (status.error) throw new Error(status.error);
          break;
        }
      }
    }

    if (!videoUrl) throw new Error('Video generation timed out');

    const latencyMs = Date.now() - started;
    const videoId = crypto.randomUUID();

    await (svc as any).from('videos').insert({
      id: videoId,
      org_id: orgId,
      user_id: user.id,
      prompt: body.prompt,
      model: body.model || 'veo-3.1-fast-generate-preview',
      aspect_ratio: body.aspectRatio || '16:9',
      duration_seconds: body.duration || 8,
      status: 'completed',
      video_url: videoUrl,
      cost_usd: isReplicate ? 0.05 : 0.08,
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, video: { id: videoId, url: videoUrl, latencyMs } });
  } catch (e) {
    console.error('[video-generate]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
