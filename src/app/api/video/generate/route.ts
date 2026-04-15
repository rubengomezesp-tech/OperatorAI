import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { generateVideo, estimatedCost, type VeoModel } from '@/features/video/server/veo-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  prompt: z.string().min(3).max(2000),
  model: z.enum([
    'veo-3.1-lite-generate-preview',
    'veo-3.1-fast-generate-preview',
    'veo-3.1-generate-preview',
  ]).optional(),
  aspectRatio: z.enum(['16:9', '9:16']).optional(),
  resolution: z.enum(['720p', '1080p']).optional(),
  durationSeconds: z.union([z.literal(4), z.literal(6), z.literal(8)]).optional(),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
  projectId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  // Quota check
  const { data: quota } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: 'video_generation' });
  const q = quota as { allowed: boolean; used: number; limit: number } | null;
  if (q && !q.allowed) {
    return NextResponse.json({
      error: 'Monthly video limit reached. Upgrade to generate more.',
      quota: q,
    }, { status: 402 });
  }

  const model = (parsed.data.model ?? 'veo-3.1-fast-generate-preview') as VeoModel;
  const duration = parsed.data.durationSeconds ?? 8;
  const cost = estimatedCost(model, duration);

  try {
    const result = await generateVideo({
      prompt: parsed.data.prompt,
      model,
      aspectRatio: parsed.data.aspectRatio ?? '16:9',
      resolution: parsed.data.resolution ?? '1080p',
      durationSeconds: duration,
      imageBytes: parsed.data.imageBase64,
      imageMimeType: parsed.data.imageMimeType,
    });

    const { data: row, error } = await svc
      .from('videos')
      .insert({
        org_id: orgId,
        user_id: user.id,
        project_id: parsed.data.projectId ?? null,
        prompt: parsed.data.prompt,
        model,
        aspect_ratio: parsed.data.aspectRatio ?? '16:9',
        duration_seconds: duration,
        resolution: parsed.data.resolution ?? '1080p',
        has_audio: model !== 'veo-3.1-lite-generate-preview',
        operation_name: result.operationName,
        cost_usd: cost,
        status: 'processing',
      } as never)
      .select('id, status, prompt, model, aspect_ratio, duration_seconds, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ video: row, estimatedCostUsd: cost });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Video generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
