/**
 * GET /api/jobs/[jobId]
 *
 * Returns current status of a generation job.
 * Used by client polling.
 *
 * Response shape:
 *   {
 *     jobId, status, progress,
 *     resultUrl?, costCents?, modelUsed?,
 *     durationMs?, error?, createdAt, completedAt?
 *   }
 *
 * For real-time updates without polling, see:
 *   GET /api/jobs/[jobId]/stream  (Server-Sent Events, optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus, JobNotFoundError } from '@/lib/queue';

// ⚠️ Replace with your real auth
// import { createSupabaseServiceClient } from '@/lib/supabase';
// import { resolveOrgContext } from '@/lib/auth';

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

    // ── Auth ──────────────────────────────────────────────────────
    // const supabase = createSupabaseServiceClient();
    // const { user, orgId } = await resolveOrgContext(supabase, request);
    // if (!user || !orgId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const supabase = null as any;

    // ── Fetch ─────────────────────────────────────────────────────
    const status = await getJobStatus(supabase, jobId);

    // TODO: verify job belongs to user's org (RLS handles this if real client)

    return NextResponse.json(status, {
      headers: {
        // Cache nothing for in-flight jobs, short cache for completed
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
