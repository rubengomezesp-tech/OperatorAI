/**
 * POST /api/creative
 *
 * Async creative generation — returns { jobId } immediately.
 * Client polls GET /api/jobs/:id for status + result.
 *
 * Request body matches CreativeJobPayload (minus orgId/userId
 * which are resolved from auth).
 *
 * Response: { jobId, status, statusUrl }
 */

import { NextRequest, NextResponse } from 'next/server';
import { enqueueCreative } from '@/lib/queue';
import type { Tier } from '@/lib/models';
import type { CreativePlan } from '@/lib/composer';

// ⚠️ Replace with your real auth helpers
// import { createSupabaseServiceClient } from '@/lib/supabase';
// import { resolveOrgContext } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreativeRequestBody {
  prompt: string;
  plan: Omit<CreativePlan, 'background'>;
  tier?: Tier;
  outputType?: string;
  referenceImages?: string[];
  upscale?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreativeRequestBody;

    if (!body.prompt || !body.plan) {
      return NextResponse.json(
        { error: 'prompt and plan are required' },
        { status: 400 }
      );
    }

    // ── Auth ──────────────────────────────────────────────────────
    // const supabase = createSupabaseServiceClient();
    // const { user, orgId, tier } = await resolveOrgContext(supabase, request);
    // if (!user || !orgId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // ⚠️ TEMPORARY — replace with real auth
    const supabase = null as any;
    const orgId = 'placeholder-org';
    const userId = 'placeholder-user';
    const tier: Tier = body.tier ?? 'pro';

    // ── Idempotency key from header ────────────────────────────────
    const idempotencyKey = request.headers.get('Idempotency-Key') ?? undefined;

    // ── Enqueue ───────────────────────────────────────────────────
    const result = await enqueueCreative(
      {
        type: 'creative',
        orgId,
        userId,
        tier,
        prompt: body.prompt,
        plan: body.plan,
        outputType: body.outputType as any,
        referenceImages: body.referenceImages,
        upscale: body.upscale,
      },
      {
        supabase,
        idempotencyKey,
      }
    );

    return NextResponse.json({
      jobId: result.jobId,
      status: result.status,
      statusUrl: `/api/jobs/${result.jobId}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to enqueue creative job', details: (err as Error).message },
      { status: 500 }
    );
  }
}
