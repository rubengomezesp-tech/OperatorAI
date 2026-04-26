/**
 * Operator AI — Job Queue
 * Phase 4 / Types
 */

import type { CreativePlan, BrandKit } from '@/lib/composer';
import type { Tier, OutputType } from '@/lib/models';

// ────────────────────────────────────────────────────────────────
// JOB STATUS
// ────────────────────────────────────────────────────────────────

export type JobStatus =
  | 'pending'   // accepted, not yet in queue
  | 'queued'    // in BullMQ waiting list
  | 'running'   // worker is processing
  | 'completed' // finished successfully
  | 'failed'    // exhausted retries
  | 'cancelled'; // user/admin cancelled

export type JobType = 'creative' | 'mockup' | 'upscale' | 'variant';

// ────────────────────────────────────────────────────────────────
// JOB INPUT (what gets queued)
// ────────────────────────────────────────────────────────────────

export interface CreativeJobPayload {
  type: 'creative';
  orgId: string;
  userId: string;
  tier: Tier;
  prompt: string;
  plan: Omit<CreativePlan, 'background'>;
  brandKitOverride?: BrandKit;
  outputType?: OutputType;
  referenceImages?: string[];
  upscale?: boolean;
}

export interface UpscaleJobPayload {
  type: 'upscale';
  orgId: string;
  userId: string;
  imageUrl: string;
  scale: 2 | 4;
  faceEnhance?: boolean;
}

export interface VariantJobPayload {
  type: 'variant';
  orgId: string;
  userId: string;
  tier: Tier;
  basePrompt: string;
  basePlan: Omit<CreativePlan, 'background'>;
  variantCount: number; // how many variations (1-10)
}

export type JobPayload = CreativeJobPayload | UpscaleJobPayload | VariantJobPayload;

// ────────────────────────────────────────────────────────────────
// JOB RECORD (DB row)
// ────────────────────────────────────────────────────────────────

export interface JobRecord {
  id: string;
  orgId: string;
  userId: string;
  bullmqJobId?: string;
  jobType: JobType;
  status: JobStatus;
  progress: number;
  attempts: number;
  maxAttempts: number;
  input: JobPayload;
  inputHash?: string;
  resultUrl?: string;
  resultMetadata?: Record<string, unknown>;
  costCents: number;
  modelUsed?: string;
  errorMessage?: string;
  errorCode?: string;
  errorStack?: string;
  idempotencyKey?: string;
  createdAt: string;
  queuedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

// ────────────────────────────────────────────────────────────────
// JOB RESULT (what /api/jobs/:id returns)
// ────────────────────────────────────────────────────────────────

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  resultUrl?: string;
  costCents?: number;
  modelUsed?: string;
  durationMs?: number;
  error?: {
    message: string;
    code?: string;
  };
  createdAt: string;
  completedAt?: string;
}

// ────────────────────────────────────────────────────────────────
// QUEUE NAMES
// ────────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  CREATIVE: 'operator:creative',
  UPSCALE: 'operator:upscale',
  VARIANT: 'operator:variant',
} as const;

// ────────────────────────────────────────────────────────────────
// ERRORS
// ────────────────────────────────────────────────────────────────

export class JobNotFoundError extends Error {
  constructor(public readonly jobId: string) {
    super(`Job not found: ${jobId}`);
    this.name = 'JobNotFoundError';
  }
}

export class JobQueueError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'JobQueueError';
  }
}
