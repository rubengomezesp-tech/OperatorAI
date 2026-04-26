/**
 * Operator AI — Job Queue
 * Phase 4 / Producer
 *
 * Enqueues jobs onto BullMQ + creates a row in generation_jobs.
 * The HTTP route handler calls this and returns { jobId } immediately.
 */

import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getRedisClient } from './redis';
import {
  QUEUE_NAMES,
  type CreativeJobPayload,
  type UpscaleJobPayload,
  type VariantJobPayload,
  type JobPayload,
  type JobRecord,
  JobQueueError,
} from './types';

// ────────────────────────────────────────────────────────────────
// QUEUE INSTANCES (cached)
// ────────────────────────────────────────────────────────────────

let queues: { creative?: Queue; upscale?: Queue; variant?: Queue } = {};

function getCreativeQueue(): Queue {
  if (!queues.creative) {
    queues.creative = new Queue(QUEUE_NAMES.CREATIVE, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { age: 86400, count: 1000 }, // keep 24h or 1000 jobs
        removeOnFail: { age: 7 * 86400 }, // keep failed jobs 7 days
      },
    });
  }
  return queues.creative;
}

function getUpscaleQueue(): Queue {
  if (!queues.upscale) {
    queues.upscale = new Queue(QUEUE_NAMES.UPSCALE, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { age: 86400 },
      },
    });
  }
  return queues.upscale;
}

function getVariantQueue(): Queue {
  if (!queues.variant) {
    queues.variant = new Queue(QUEUE_NAMES.VARIANT, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 86400 },
      },
    });
  }
  return queues.variant;
}

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface EnqueueOptions {
  supabase: SupabaseClient;
  /** Optional: client-supplied idempotency key */
  idempotencyKey?: string;
  /** Optional: priority (higher = sooner) */
  priority?: number;
  /** Optional: delay in ms before processing */
  delayMs?: number;
}

export interface EnqueueResult {
  jobId: string;
  bullmqJobId: string;
  status: 'queued' | 'deduplicated';
}

/**
 * Enqueue a creative job (the most common case).
 * Returns immediately with { jobId } — the HTTP handler returns this to client.
 */
export async function enqueueCreative(
  payload: CreativeJobPayload,
  options: EnqueueOptions
): Promise<EnqueueResult> {
  return enqueue(payload, getCreativeQueue(), 'creative', options);
}

export async function enqueueUpscale(
  payload: UpscaleJobPayload,
  options: EnqueueOptions
): Promise<EnqueueResult> {
  return enqueue(payload, getUpscaleQueue(), 'upscale', options);
}

export async function enqueueVariant(
  payload: VariantJobPayload,
  options: EnqueueOptions
): Promise<EnqueueResult> {
  return enqueue(payload, getVariantQueue(), 'variant', options);
}

// ────────────────────────────────────────────────────────────────
// CORE ENQUEUE LOGIC
// ────────────────────────────────────────────────────────────────

async function enqueue(
  payload: JobPayload,
  queue: Queue,
  jobType: JobRecord['jobType'],
  options: EnqueueOptions
): Promise<EnqueueResult> {
  const { supabase, idempotencyKey, priority = 0, delayMs = 0 } = options;

  // Compute hash for dedup
  const inputHash = hashPayload(payload);

  // Check for existing job with same idempotency key
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('generation_jobs')
      .select('id, bullmq_job_id, status')
      .eq('idempotency_key', idempotencyKey)
      .eq('org_id', payload.orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && (existing.status === 'queued' || existing.status === 'running' || existing.status === 'completed')) {
      return {
        jobId: existing.id,
        bullmqJobId: existing.bullmq_job_id ?? existing.id,
        status: 'deduplicated',
      };
    }
  }

  // 1. Insert pending row in DB
  const { data: insertResult, error: insertError } = await supabase
    .from('generation_jobs')
    .insert({
      org_id: payload.orgId,
      user_id: payload.userId,
      job_type: jobType,
      status: 'pending',
      input: payload,
      input_hash: inputHash,
      idempotency_key: idempotencyKey,
    })
    .select('id')
    .single();

  if (insertError || !insertResult) {
    throw new JobQueueError(
      `Failed to insert job row: ${insertError?.message ?? 'unknown'}`,
      insertError
    );
  }

  const jobId = insertResult.id as string;

  // 2. Push to BullMQ
  try {
    const bullmqJob = await queue.add(
      jobType,
      { ...payload, dbJobId: jobId },
      {
        jobId, // use our DB id as BullMQ job ID
        priority,
        delay: delayMs,
      }
    );

    // 3. Update row to 'queued'
    await supabase
      .from('generation_jobs')
      .update({
        status: 'queued',
        bullmq_job_id: bullmqJob.id ?? jobId,
      })
      .eq('id', jobId);

    return {
      jobId,
      bullmqJobId: bullmqJob.id ?? jobId,
      status: 'queued',
    };
  } catch (err) {
    // BullMQ failed — mark job as failed and rethrow
    await supabase
      .from('generation_jobs')
      .update({
        status: 'failed',
        error_message: `Failed to push to queue: ${(err as Error).message}`,
      })
      .eq('id', jobId);

    throw new JobQueueError('Failed to push to queue', err);
  }
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function hashPayload(payload: JobPayload): string {
  const stable = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(stable).digest('hex').substring(0, 16);
}

// ────────────────────────────────────────────────────────────────
// CLEAN SHUTDOWN
// ────────────────────────────────────────────────────────────────

export async function closeAllQueues(): Promise<void> {
  await Promise.all([
    queues.creative?.close(),
    queues.upscale?.close(),
    queues.variant?.close(),
  ]);
  queues = {};
}
