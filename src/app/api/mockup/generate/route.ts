import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { orchestrate } from '@/features/ai-mockup/server/mockup-engine';
import type { MockupJobInput } from '@/features/ai-mockup/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

const CustomPlacement = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  rotation: z.number().min(-180).max(180).default(0),
});

const Body = z.object({
  logoUrl: z.string().url(),
  garmentUrl: z.string().url(),
  garmentWidth: z.number().int().positive(),
  garmentHeight: z.number().int().positive(),
  garmentType: z.enum(['tshirt_front', 'tshirt_back', 'hoodie', 'cap', 'tote']),
  placement: z.enum(['chest', 'sleeve', 'back', 'front', 'side', 'center', 'custom']),
  customPlacement: CustomPlacement.optional(),
  applicationStyle: z.enum(['print', 'embroidery', 'patch', 'vinyl']),
  mode: z.enum(['exact_overlay', 'ai_integrated']),
  controls: z.object({
    depth: z.number().min(0).max(1).default(0.5),
    integration: z.number().min(0).max(1).default(0.5),
    texture: z.number().min(0).max(1).default(0.5),
  }),
});

export async function POST(req: NextRequest) {
  if (process.env.MOCKUP_ENGINE_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Mockup engine disabled' }, { status: 403 });
  }

  try {
    const body = Body.parse(await req.json());

    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    const { orgId } = await resolveOrgContext(svc, user.id);

    const input: MockupJobInput & {
      garmentWidth: number;
      garmentHeight: number;
      userId: string;
      orgId: string;
    } = {
      logoUrl: body.logoUrl,
      garmentUrl: body.garmentUrl,
      garmentType: body.garmentType,
      placement: body.placement,
      customPlacement: body.customPlacement,
      applicationStyle: body.applicationStyle,
      mode: body.mode,
      controls: body.controls,
      garmentWidth: body.garmentWidth,
      garmentHeight: body.garmentHeight,
      userId: user.id,
      orgId,
    };

    const { data: row, error: insErr } = await svc
      .from('mockup_jobs' as any)
      .insert({
        user_id: user.id,
        org_id: orgId,
        logo_url: body.logoUrl,
        garment_url: body.garmentUrl,
        garment_type: body.garmentType,
        placement: body.placement,
        placement_custom: body.customPlacement ?? null,
        application_style: body.applicationStyle,
        mode: body.mode,
        depth_level: body.controls.depth,
        integration_level: body.controls.integration,
        texture_level: body.controls.texture,
        status: 'processing',
      })
      .select('id')
      .single();

    if (insErr || !row) {
      return NextResponse.json({ error: 'Failed to create job', detail: insErr?.message }, { status: 500 });
    }
    const jobId = (row as any).id as string;

    const directive = await orchestrate(input);

    await svc
      .from('mockup_jobs' as any)
      .update({
        status: directive.error && !directive.useOverlay ? 'failed' : 'done',
        result_url: directive.imageUrl ?? null,
        engine_used: directive.engineUsed,
        fallback_used: directive.fallbackUsed,
        preservation_score: directive.preservationScore ?? null,
        latency_ms: directive.latencyMs,
        error: directive.error ?? null,
      })
      .eq('id', jobId);

    return NextResponse.json({
      ok: true,
      jobId,
      useOverlay: directive.useOverlay,
      imageUrl: directive.imageUrl ?? null,
      engineUsed: directive.engineUsed,
      fallbackUsed: directive.fallbackUsed,
      latencyMs: directive.latencyMs,
      note: directive.error ?? null,
    });
  } catch (err) {
    console.error('[mockup/generate] error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
