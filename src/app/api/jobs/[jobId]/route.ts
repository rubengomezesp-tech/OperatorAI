/**
 * GET /api/jobs/[jobId]
 *
 * Returns current status of a generation job.
 * Used by client polling.
 *
 * Auth: requires authenticated user. The job must belong to user's org.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/lib/auth';
import { getJobStatus, JobNotFoundError } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // ── 1. Auth ──────────────────────────────────────────────────
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const svc = createSupabaseServiceClient();
    let orgId: string;
    try {
      const ctx = await resolveOrgContext(svc, user.id);
      if (!ctx.orgId) {
        return NextResponse.json(
          { error: 'No active organization' },
          { status: 403 }
        );
      }
      orgId = ctx.orgId;
    } catch {
      return NextResponse.json({ error: 'Failed to resolve org' }, { status: 403 });
    }

    // ── 2. Fetch job status ──────────────────────────────────────
    const status = await getJobStatus(svc, jobId);

    // ── 3. Verify ownership ──────────────────────────────────────
    // The job must belong to the requesting user's org.
    // Using service client we need to manually check this since RLS is bypassed.
    const { data: job } = await svc
      .from('generation_jobs')
      .select('org_id, user_id')
      .eq('id', jobId)
      .maybeSingle();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.org_id !== orgId) {
      // Don't reveal that the job exists for another org
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(status, {
      headers: {
        'Cache-Control':
          status.status === 'completed' || status.status === 'failed'
            ? 'private, max-age=60'
            : 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof JobNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch job status', details: (err as Error).message },
      { status: 500 }
    );
  }
}
