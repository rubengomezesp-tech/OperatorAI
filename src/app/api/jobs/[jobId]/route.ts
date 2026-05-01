/**
 * GET /api/jobs/[jobId]
 *
 * Returns current status of a generation job.
 *
 * Auth: requires authenticated user. Job must belong to user's org.
 *
 * NOTE: This route reads from generation_jobs table.
 * That table requires queue migration to be applied.
 * Until applied, this route returns 404 for any job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getJobStatus, JobNotFoundError } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Auth
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

    // Verify job ownership BEFORE returning status
    // NOTE: generation_jobs table requires queue migration to be applied.
    // We cast through `any` so the build passes without the migration.
    let jobOrgId: string | null = null;
    try {
      const { data: job } = await (svc as any)
        .from('generation_jobs')
        .select('org_id, user_id')
        .eq('id', jobId)
        .maybeSingle();

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      jobOrgId = job.org_id;
    } catch (err) {
      console.warn('[jobs/[jobId]] generation_jobs query failed', {
        error: err instanceof Error ? err.message : String(err),
        hint: 'Apply queue migration to enable job status tracking',
      });
      return NextResponse.json(
        { error: 'Job tracking not yet enabled' },
        { status: 503 }
      );
    }

    if (jobOrgId !== orgId) {
      // Don't reveal that the job exists for another org
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch job status from queue
    const status = await getJobStatus(svc, jobId);

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
