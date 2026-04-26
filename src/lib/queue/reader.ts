/**
 * Operator AI — Job Queue
 * Phase 4 / Reader
 *
 * Reads job status from DB.
 * Used by GET /api/jobs/:id endpoint for polling.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { JobRecord, JobStatusResponse } from './types';
import { JobNotFoundError } from './types';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

/**
 * Get current status of a single job.
 * Throws JobNotFoundError if not found.
 */
export async function getJobStatus(
  supabase: SupabaseClient,
  jobId: string
): Promise<JobStatusResponse> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch job: ${error.message}`);
  }

  if (!data) {
    throw new JobNotFoundError(jobId);
  }

  return mapRowToResponse(data);
}

/**
 * List jobs for an org (history view).
 */
export async function listJobs(
  supabase: SupabaseClient,
  orgId: string,
  options: {
    limit?: number;
    offset?: number;
    status?: JobRecord['status'];
    jobType?: JobRecord['jobType'];
  } = {}
): Promise<JobStatusResponse[]> {
  const { limit = 20, offset = 0, status, jobType } = options;

  let query = supabase
    .from('generation_jobs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (jobType) query = query.eq('job_type', jobType);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list jobs: ${error.message}`);
  }

  return (data ?? []).map(mapRowToResponse);
}

/**
 * Cancel a queued or running job.
 * NOTE: Does not stop a job already running on a worker — it just
 * marks it as cancelled. Real cancellation requires worker cooperation.
 */
export async function cancelJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  await supabase
    .from('generation_jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId)
    .in('status', ['pending', 'queued']);
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function mapRowToResponse(row: any): JobStatusResponse {
  return {
    jobId: row.id,
    status: row.status,
    progress: row.progress ?? 0,
    resultUrl: row.result_url ?? undefined,
    costCents: row.cost_cents ?? 0,
    modelUsed: row.model_used ?? undefined,
    durationMs: row.completed_at && row.started_at
      ? new Date(row.completed_at).getTime() - new Date(row.started_at).getTime()
      : undefined,
    error: row.error_message
      ? { message: row.error_message, code: row.error_code }
      : undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  };
}
