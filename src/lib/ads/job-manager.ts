/**
 * Job Manager — gestiona jobs asíncronos en Supabase.
 * Permite crear, actualizar, y consultar el estado de generación.
 */

import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { AdJob, StageLog, VariantResult, CreativePlan } from './types';

const svc = createSupabaseServiceClient();

const TABLE = 'ad_jobs' as const;

/**
 * Crea un nuevo job en Supabase.
 */
export async function createJob(params: {
  jobId: string;
  creativePlanId: string;
  orgId: string;
  userId: string;
  creativePlan: CreativePlan;
}): Promise<void> {
  try {
    await (svc as any).from('ad_jobs').insert({
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[job-manager] createJob failed (non-fatal):', e);
    // No lanzar error — el job sigue en memoria
  }
}

/**
 * Actualiza el estado de un job.
 */
export async function updateJob(params: {
  jobId: string;
  status?: AdJob['status'];
  progress?: number;
  currentStage?: string;
  stage?: StageLog;
  result?: VariantResult;
}): Promise<void> {
  try {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (params.status) updates.status = params.status;
    if (params.progress !== undefined) updates.progress = params.progress;
    if (params.currentStage) updates.current_stage = params.currentStage;

    if (params.stage) {
      // Append stage to existing stages array
      const { data: current } = await (svc as any)
        .from('ad_jobs')
        .select('stages')
        .eq('job_id', params.jobId)
        .single();
      
      const stages = [...(current?.stages || []), params.stage];
      updates.stages = stages;
    }

    if (params.result) {
      const { data: current } = await (svc as any)
        .from('ad_jobs')
        .select('results')
        .eq('job_id', params.jobId)
        .single();
      
      const results = [...(current?.results || [])];
      const existingIdx = results.findIndex(
        (r: any) => r.variantId === params.result!.variantId
      );
      if (existingIdx >= 0) {
        results[existingIdx] = params.result;
      } else {
        results.push(params.result);
      }
      updates.results = results;
    }

    await (svc as any).from('ad_jobs').update(updates).eq('job_id', params.jobId);
  } catch (e) {
    console.warn('[job-manager] updateJob failed (non-fatal):', e);
  }
}

/**
 * Obtiene un job por su ID.
 */
export async function getJob(jobId: string): Promise<AdJob | null> {
  try {
    const { data } = await (svc as any)
      .from('ad_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (!data) return null;

    return {
      jobId: data.job_id,
      creativePlanId: data.creative_plan_id,
      orgId: data.org_id,
      userId: data.user_id,
      status: data.status,
      progress: data.progress,
      currentStage: data.current_stage,
      stages: data.stages || [],
      results: data.results || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch {
    return null;
  }
}

/**
 * SQL para crear la tabla (ejecutar en Supabase):
 */
export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS public.ad_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  creative_plan_id TEXT NOT NULL,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  current_stage TEXT DEFAULT 'planning',
  stages JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '[]'::jsonb,
  creative_plan JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_jobs_job_id ON public.ad_jobs (job_id);
CREATE INDEX IF NOT EXISTS idx_ad_jobs_org_id ON public.ad_jobs (org_id);
CREATE INDEX IF NOT EXISTS idx_ad_jobs_status ON public.ad_jobs (status);
`;
