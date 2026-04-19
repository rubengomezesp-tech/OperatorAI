import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import Replicate from 'replicate';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 120;

const BodySchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  aspectRatio: z.enum(['16:9', '9:16']).optional(),
  duration: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    let orgId: string;
    try {
      orgId = (await resolveOrgContext(svc, user.id)).orgId;
    } catch {
      return NextResponse.json({ error: 'No workspace' }, { status: 403 });
    }

    if (!serverEnv.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'Video generation not configured' }, { status: 500 });
    }

    const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });
    const started = Date.now();

    const output = await client.run(
      'minimax/video-01',
      {
        input: {
          prompt: body.prompt,
          prompt_optimizer: true,
        },
      },
    );

    // Extract video URL
    let videoUrl = '';
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (output && typeof output === 'object' && 'url' in (output as any)) {
      videoUrl = String((output as any).url);
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'No video generated' }, { status: 500 });
    }

    const latencyMs = Date.now() - started;

    // Save to DB
    const videoId = crypto.randomUUID();
    await (svc as any).from('videos').insert({
      id: videoId,
      org_id: orgId,
      user_id: user.id,
      prompt: body.prompt,
      model: 'minimax/video-01',
      aspect_ratio: body.aspectRatio || '16:9',
      duration_seconds: body.duration || 6,
      status: 'completed',
      video_url: videoUrl,
      cost_usd: 0.05,
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      ok: true, 
      video: { id: videoId, url: videoUrl, latencyMs } 
    });
  } catch (e) {
    console.error('[video-generate]', e);
    const msg = e instanceof Error ? e.message : 'Video generation failed';
    if (msg.includes('429') || msg.includes('throttled')) {
      return NextResponse.json({ error: 'Rate limited. Please wait a moment.' }, { status: 429 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
