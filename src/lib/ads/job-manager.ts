/**
 * Job Manager — gestiona jobs asíncronos con doble capa:
 *   1. Memoria en proceso (Map): fuente primaria, siempre disponible.
 *   2. Supabase: persistencia best-effort para que sobreviva entre procesos.
 *
 * Por qué memory-first:
 *   - Los ads se generan en menos de 2 minutos en el mismo proceso Node.
 *   - No necesitamos persistir entre reinicios para el flujo principal.
 *   - Supabase falla a veces (RLS, schema desactualizado) — la memoria SIEMPRE responde.
 *   - getJob() inmediatamente después de updateJob() ya no tiene race conditions.
 *
 * Si Supabase está bien configurado, también persiste — los dos backends son
 * complementarios, no exclusivos.
 */

import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { AdJob, StageLog, VariantResult, CreativePlan } from './types';

// ─── Memory store ──────────────────────────────────────────────────────────
// Map vive durante la vida del proceso Node. En Next.js dev se reinicia con
// hot-reload, en prod con Vercel/etc cada función es un worker separado.
// Para un job que dura ~90s en el mismo proceso, esto es perfecto.

const MEMORY_STORE = new Map<string, AdJob>();

// TTL: limpiamos jobs viejos de la memoria pasados 30 minutos
const MEMORY_TTL_MS = 30 * 60 * 1000;

function cleanupOldJobs(): void {
  const now = Date.now();
  for (const [jobId, job] of MEMORY_STORE.entries()) {
    const created = new Date(job.created_at).getTime();
    if (now - created > MEMORY_TTL_MS) {
      MEMORY_STORE.delete(jobId);
    }
  }
}

// ─── Supabase service (lazy init para evitar errores al importar) ──────────

let _svc: ReturnType<typeof createSupabaseServiceClient> | null = null;
function getSvc() {
  if (!_svc) _svc = createSupabaseServiceClient();
  return _svc;
}

const TABLE = 'ad_jobs' as const;

// ─── createJob ─────────────────────────────────────────────────────────────

export async function createJob(params: {
  jobId: string;
  creativePlanId: string;
  orgId: string;
  userId: string;
  creativePlan: CreativePlan;
}): Promise<void> {
  cleanupOldJobs();

  const now = new Date().toISOString();

  // 1) Memoria — SIEMPRE
  const job: AdJob = {
    jobId: params.jobId,
    creativePlanId: params.creativePlanId,
    orgId: params.orgId,
    userId: params.userId,
    status: 'planning',
    progress: 0,
    currentStage: 'planning',
    stages: [],
    results: [],
    created_at: now,
    updated_at: now,
  };
  MEMORY_STORE.set(params.jobId, job);

  // 2) Supabase — best-effort, no bloquea
  try {
    const svc = getSvc();
    const { error } = await (svc as unknown as {
      from: (t: string) => { insert: (row: Record<string, unknown>) => Promise<{ error: unknown }> };
    })
      .from(TABLE)
      .insert({
        job_id: params.jobId,
        creative_plan_id: params.creativePlanId,
        org_id: params.orgId,
        user_id: params.userId,
        status: 'planning',
        progress: 0,
        current_stage: 'planning',
        stages: [],
        results: [],
        creative_plan: params.creativePlan,
        created_at: now,
        updated_at: now,
      });
    if (error) {
      console.warn('[job-manager] Supabase createJob non-fatal error:', JSON.stringify(error));
    }
  } catch (e) {
    console.warn('[job-manager] Supabase createJob exception (non-fatal):', e instanceof Error ? e.message : e);
  }
}

// ─── updateJob ─────────────────────────────────────────────────────────────

export async function updateJob(params: {
  jobId: string;
  status?: AdJob['status'];
  progress?: number;
  currentStage?: string;
  stage?: StageLog;
  result?: VariantResult;
}): Promise<void> {
  // 1) Memoria — actualización inmediata
  const job = MEMORY_STORE.get(params.jobId);
  if (job) {
    if (params.status) job.status = params.status;
    if (params.progress !== undefined) job.progress = params.progress;
    if (params.currentStage) job.currentStage = params.currentStage;
    if (params.stage) {
      job.stages = [...job.stages, params.stage];
    }
    if (params.result) {
      const existingIdx = job.results.findIndex(
        (r) => r.variantId === params.result!.variantId,
      );
      if (existingIdx >= 0) {
        job.results[existingIdx] = params.result;
      } else {
        job.results.push(params.result);
      }
    }
    job.updated_at = new Date().toISOString();
    MEMORY_STORE.set(params.jobId, job);
  } else {
    console.warn('[job-manager] updateJob: jobId not in memory:', params.jobId);
  }

  // 2) Supabase — best-effort
  try {
    const svc = getSvc();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (params.status) updates.status = params.status;
    if (params.progress !== undefined) updates.progress = params.progress;
    if (params.currentStage) updates.current_stage = params.currentStage;

    if (params.stage || params.result) {
      // Para stages/results necesitamos los arrays completos.
      // Si tenemos memoria, usamos esa (instantáneo, sin race).
      // Si no, leemos de Supabase (puede tener race, pero es fallback).
      if (job) {
        if (params.stage) updates.stages = job.stages;
        if (params.result) updates.results = job.results;
      } else {
        const { data: current } = await (svc as unknown as {
          from: (t: string) => {
            select: (cols: string) => {
              eq: (col: string, val: string) => {
                single: () => Promise<{ data: Record<string, unknown> | null }>;
              };
            };
          };
        })
          .from(TABLE)
          .select('stages, results')
          .eq('job_id', params.jobId)
          .single();
        if (current) {
          if (params.stage) {
            updates.stages = [...((current.stages as StageLog[]) || []), params.stage];
          }
          if (params.result) {
            const results = [...((current.results as VariantResult[]) || [])];
            const idx = results.findIndex((r) => r.variantId === params.result!.variantId);
            if (idx >= 0) results[idx] = params.result;
            else results.push(params.result);
            updates.results = results;
          }
        }
      }
    }

    const { error } = await (svc as unknown as {
      from: (t: string) => {
        update: (u: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: unknown }>;
        };
      };
    })
      .from(TABLE)
      .update(updates)
      .eq('job_id', params.jobId);
    if (error) {
      console.warn('[job-manager] Supabase updateJob non-fatal:', JSON.stringify(error));
    }
  } catch (e) {
    console.warn('[job-manager] Supabase updateJob exception (non-fatal):', e instanceof Error ? e.message : e);
  }
}

// ─── getJob ────────────────────────────────────────────────────────────────

export async function getJob(jobId: string): Promise<AdJob | null> {
  // 1) Memoria primero — fuente de verdad para jobs en curso
  const memoryJob = MEMORY_STORE.get(jobId);
  if (memoryJob) return memoryJob;

  // 2) Fallback Supabase — para jobs viejos o de otros procesos
  try {
    const svc = getSvc();
    const { data } = await (svc as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            single: () => Promise<{ data: Record<string, unknown> | null }>;
          };
        };
      };
    })
      .from(TABLE)
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (!data) return null;

    return {
      jobId: data.job_id as string,
      creativePlanId: data.creative_plan_id as string,
      orgId: data.org_id as string,
      userId: data.user_id as string,
      status: data.status as AdJob['status'],
      progress: data.progress as number,
      currentStage: data.current_stage as string,
      stages: (data.stages as StageLog[]) || [],
      results: (data.results as VariantResult[]) || [],
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  } catch {
    return null;
  }
}

// ─── DEBUG (opcional) ──────────────────────────────────────────────────────

export function getMemoryStoreSize(): number {
  return MEMORY_STORE.size;
}

// ─── MIGRATION SQL ─────────────────────────────────────────────────────────

export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS public.ad_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  creative_plan_id TEXT NOT NULL,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL,
  progress INT DEFAULT 0,
  current_stage TEXT,
  stages JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '[]'::jsonb,
  creative_plan JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ad_jobs_job_id ON public.ad_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_ad_jobs_org_id ON public.ad_jobs(org_id);
`;
