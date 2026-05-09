-- ════════════════════════════════════════════════════════════════
-- Migration: ad_jobs table
-- Date: 2026-05-08
-- Purpose: Async job tracking for ad generation pipeline
--          (brain-bridge → job-processor → image-generator)
-- ════════════════════════════════════════════════════════════════

-- ─── TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  creative_plan_id TEXT NOT NULL,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  progress INT DEFAULT 0,
  current_stage TEXT,
  stages JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '[]'::jsonb,
  creative_plan JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_jobs_job_id ON public.ad_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_ad_jobs_org_id ON public.ad_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_ad_jobs_user_id ON public.ad_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_jobs_status ON public.ad_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ad_jobs_created_at ON public.ad_jobs(created_at DESC);

-- ─── RLS (Row Level Security) ─────────────────────────────────────
ALTER TABLE public.ad_jobs ENABLE ROW LEVEL SECURITY;

-- Service role: full access (used by backend)
CREATE POLICY "ad_jobs_service_role_all"
  ON public.ad_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users: can read their own jobs
CREATE POLICY "ad_jobs_user_read_own"
  ON public.ad_jobs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ─── AUTO UPDATE updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_ad_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ad_jobs_updated_at ON public.ad_jobs;
CREATE TRIGGER trg_ad_jobs_updated_at
  BEFORE UPDATE ON public.ad_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ad_jobs_updated_at();

-- ─── COMMENTS (documentación) ─────────────────────────────────────
COMMENT ON TABLE public.ad_jobs IS 'Async job tracking for ad generation pipeline. Memory-first architecture: backend keeps in-memory cache, this table is best-effort persistence for cross-process visibility.';
COMMENT ON COLUMN public.ad_jobs.job_id IS 'Unique identifier (job_<timestamp>_<random>). Source of truth for backend.';
COMMENT ON COLUMN public.ad_jobs.status IS 'planning | generating | composing | uploading | done | failed';
COMMENT ON COLUMN public.ad_jobs.progress IS '0-100 progress percentage';
COMMENT ON COLUMN public.ad_jobs.stages IS 'Array of {stage, status, durationMs, ...} stage logs';
COMMENT ON COLUMN public.ad_jobs.results IS 'Array of {variantId, urls, status, error?} per variant generated';
