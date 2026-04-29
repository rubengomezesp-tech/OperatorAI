-- ═══════════════════════════════════════════════════════════════
-- error_reports — tracks chat failures for admin visibility
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID,
  conversation_id UUID,
  error_message TEXT NOT NULL,
  error_context JSONB DEFAULT '{}'::jsonb,
  consecutive_failures INTEGER DEFAULT 1,
  user_agent TEXT,
  url TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_reports_user
  ON public.error_reports(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_reports_unresolved
  ON public.error_reports(resolved, created_at DESC)
  WHERE resolved = FALSE;

-- RLS
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own error reports
CREATE POLICY "users_insert_own_errors"
  ON public.error_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admin can read all (handled via service role at app level)
-- Users can read their own reports
CREATE POLICY "users_read_own_errors"
  ON public.error_reports FOR SELECT
  USING (auth.uid() = user_id);
