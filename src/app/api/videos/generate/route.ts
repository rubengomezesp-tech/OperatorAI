import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { generateVideo, pollVideoStatus } from '@/features/video/server/veo-client';

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

    // Start Veo generation
    const op = await generateVideo({
      prompt: body.prompt,
      model: (body.model as any) || 'veo-3.1-fast-generate-preview',
      aspectRatio: body.aspectRatio || '16:9',
      durationSeconds: (body.duration as any) || 8,
      imageBytes: body.referenceBase64,
      imageMimeType: body.referenceMimeType,
    });

    // Poll for result (max 4 minutes)
    let videoUrl = '';
    for (let i = 0; i < 48; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const status = await pollVideoStatus(op.operationName);
      if (status.done) {
        if (status.videoUri) { videoUrl = status.videoUri; }
        if (status.error) { throw new Error(status.error); }
        break;
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
      cost_usd: 0.05,
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, video: { id: videoId, url: videoUrl, latencyMs } });
  } catch (e) {
    console.error('[video-generate]', e);
    const msg = e instanceof Error ? e.message : 'Video generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
