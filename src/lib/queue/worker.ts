/**
 * Operator AI — Job Queue
 * Phase 4 / Worker
 *
 * Consumes jobs from BullMQ and executes them.
 * This file is intended to run as a SEPARATE PROCESS, not in the
 * Next.js request handler.
 *
 * Deploy options:
 * - Railway / Render: standalone Node service, run `node dist/worker.js`
 * - Fly.io: a separate machine with `pnpm worker:start`
 * - Local dev: `pnpm worker:dev`
 *
 * Worker is horizontally scalable — run N instances, BullMQ
 * distributes jobs automatically.
 */

import { Worker, type Job } from 'bullmq';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getRedisClient } from './redis';
import {
  QUEUE_NAMES,
  type CreativeJobPayload,
  type UpscaleJobPayload,
  type VariantJobPayload,
  type JobRecord,
} from './types';

// These imports are the actual generation logic
// (already implemented in earlier phases)
import { smartGenerate } from '@/lib/models/smart-generate';
import { upscaleImage } from '@/lib/models';
import { uploadToStorage } from '@/lib/brand-os/storage';

// ⚠️ Replace with your real Supabase client factory
// import { createSupabaseServiceClient } from '@/lib/supabase';

// ────────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────────

const CREATIVE_CONCURRENCY = 5;  // 5 ads in parallel per worker
const UPSCALE_CONCURRENCY = 3;
const VARIANT_CONCURRENCY = 2;

// ────────────────────────────────────────────────────────────────
// WORKER STARTUP
// ────────────────────────────────────────────────────────────────

/**
 * Start all workers. Call this from your worker entrypoint.
 *
 * Example worker.ts:
 *   import { startWorkers } from '@/lib/queue/worker';
 *   import { createSupabaseServiceClient } from '@/lib/supabase';
 *   startWorkers(createSupabaseServiceClient());
 */
export function startWorkers(supabaseFactory: () => SupabaseClient) {
  const connection = getRedisClient();

  // ── Creative worker ────────────────────────────────────────────
  const creativeWorker = new Worker(
    QUEUE_NAMES.CREATIVE,
    async (job) => processCreativeJob(job, supabaseFactory()),
    {
      connection,
      concurrency: CREATIVE_CONCURRENCY,
      limiter: {
        max: 30,        // max 30 jobs per
        duration: 60000, // 60 seconds (= 30 jobs/min per worker)
      },
    }
  );

  attachWorkerListeners(creativeWorker, 'creative');

  // ── Upscale worker ────────────────────────────────────────────
  const upscaleWorker = new Worker(
    QUEUE_NAMES.UPSCALE,
    async (job) => processUpscaleJob(job, supabaseFactory()),
    {
      connection,
      concurrency: UPSCALE_CONCURRENCY,
    }
  );

  attachWorkerListeners(upscaleWorker, 'upscale');

  // ── Variant worker ────────────────────────────────────────────
  const variantWorker = new Worker(
    QUEUE_NAMES.VARIANT,
    async (job) => processVariantJob(job, supabaseFactory()),
    {
      connection,
      concurrency: VARIANT_CONCURRENCY,
    }
  );

  attachWorkerListeners(variantWorker, 'variant');

  // eslint-disable-next-line no-console
  console.log('[worker] Started: creative, upscale, variant queues active');

  // Return cleanup function
  return async () => {
    await Promise.all([creativeWorker.close(), upscaleWorker.close(), variantWorker.close()]);
  };
}

// ────────────────────────────────────────────────────────────────
// JOB HANDLERS
// ────────────────────────────────────────────────────────────────

async function processCreativeJob(
  job: Job<CreativeJobPayload & { dbJobId: string }>,
  supabase: SupabaseClient
): Promise<{ resultUrl: string; modelUsed: string; costCents: number; durationMs: number }> {
  const { dbJobId, ...payload } = job.data;
  const start = Date.now();

  // Mark as running
  await updateJobStatus(supabase, dbJobId, 'running', { progress: 10 });

  try {
    // Run the smart generate pipeline
    await job.updateProgress(20);
    const result = await smartGenerate({
      ...payload,
      supabase,
    });

    await job.updateProgress(80);

    // Upload result to Supabase Storage
    const path = `${payload.orgId}/${dbJobId}.png`;
    const uploadResult = await uploadToStorage({
      supabase,
      bucket: 'image-outputs',
      path,
      buffer: result.imageBuffer,
      contentType: result.contentType,
      upsert: true,
    });

    await job.updateProgress(100);

    // Mark as completed
    await supabase
      .from('generation_jobs')
      .update({
        status: 'completed',
        progress: 100,
        result_url: uploadResult.publicUrl,
        cost_cents: result.meta.totalCostCents,
        model_used: result.meta.backgroundModel,
        result_metadata: {
          routerDecision: result.meta.routerDecision,
          backgroundUrl: result.meta.backgroundUrl,
          composerDurationMs: result.meta.composerDurationMs,
          totalDurationMs: result.meta.totalDurationMs,
          width: result.width,
          height: result.height,
        },
      })
      .eq('id', dbJobId);

    return {
      resultUrl: uploadResult.publicUrl,
      modelUsed: result.meta.backgroundModel,
      costCents: result.meta.totalCostCents,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    await markJobFailed(supabase, dbJobId, err as Error);
    throw err;
  }
}

async function processUpscaleJob(
  job: Job<UpscaleJobPayload & { dbJobId: string }>,
  supabase: SupabaseClient
): Promise<{ resultUrl: string; costCents: number }> {
  const { dbJobId, ...payload } = job.data;

  await updateJobStatus(supabase, dbJobId, 'running', { progress: 20 });

  try {
    const result = await upscaleImage(payload.imageUrl, payload.scale, payload.faceEnhance);
    await job.updateProgress(80);

    // Save result URL directly (Replicate hosts the upscaled image)
    await supabase
      .from('generation_jobs')
      .update({
        status: 'completed',
        progress: 100,
        result_url: result.imageUrl,
        cost_cents: result.costCents,
        model_used: 'real-esrgan',
      })
      .eq('id', dbJobId);

    return {
      resultUrl: result.imageUrl,
      costCents: result.costCents,
    };
  } catch (err) {
    await markJobFailed(supabase, dbJobId, err as Error);
    throw err;
  }
}

async function processVariantJob(
  job: Job<VariantJobPayload & { dbJobId: string }>,
  supabase: SupabaseClient
): Promise<{ resultUrls: string[]; costCents: number }> {
  const { dbJobId, ...payload } = job.data;
  const variantCount = Math.min(payload.variantCount, 10);

  await updateJobStatus(supabase, dbJobId, 'running', { progress: 5 });

  try {
    const results: string[] = [];
    let totalCost = 0;

    for (let i = 0; i < variantCount; i++) {
      // Different seeds → different outputs
      const seed = 42 + i * 1337;

      const result = await smartGenerate({
        orgId: payload.orgId,
        tier: payload.tier,
        prompt: payload.basePrompt,
        plan: payload.basePlan,
        supabase,
      });

      const path = `${payload.orgId}/${dbJobId}/variant-${i}.png`;
      const uploaded = await uploadToStorage({
        supabase,
        bucket: 'image-outputs',
        path,
        buffer: result.imageBuffer,
        contentType: result.contentType,
        upsert: true,
      });

      results.push(uploaded.publicUrl);
      totalCost += result.meta.totalCostCents;

      await job.updateProgress(Math.round(((i + 1) / variantCount) * 100));
    }

    await supabase
      .from('generation_jobs')
      .update({
        status: 'completed',
        progress: 100,
        result_url: results[0], // first as canonical
        cost_cents: totalCost,
        result_metadata: { variantUrls: results },
      })
      .eq('id', dbJobId);

    return {
      resultUrls: results,
      costCents: totalCost,
    };
  } catch (err) {
    await markJobFailed(supabase, dbJobId, err as Error);
    throw err;
  }
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

async function updateJobStatus(
  supabase: SupabaseClient,
  jobId: string,
  status: JobRecord['status'],
  extras: Partial<JobRecord> = {}
): Promise<void> {
  await supabase
    .from('generation_jobs')
    .update({ status, ...extras })
    .eq('id', jobId);
}

async function markJobFailed(
  supabase: SupabaseClient,
  jobId: string,
  err: Error
): Promise<void> {
  await supabase
    .from('generation_jobs')
    .update({
      status: 'failed',
      error_message: err.message,
      error_stack: err.stack?.split('\n').slice(0, 10).join('\n'),
    })
    .eq('id', jobId);
}

function attachWorkerListeners(worker: Worker, name: string): void {
  worker.on('completed', (job) => {
    // eslint-disable-next-line no-console
    console.log(`[worker:${name}] completed ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error(
      `[worker:${name}] failed ${job?.id} (attempt ${job?.attemptsMade}): ${err.message}`
    );
  });

  worker.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error(`[worker:${name}] worker error:`, err);
  });
}
