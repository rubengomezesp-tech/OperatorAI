-- ═══════════════════════════════════════════════════════════════
-- OAuth Tokens — Almacenamiento de tokens OAuth por usuario+provider
-- Sprint 4 (External Tools)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider, user_id)
);

-- Índice para lookups rápidos
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_lookup 
  ON public.oauth_tokens(provider, user_id);

-- RLS: solo el propio usuario puede leer sus tokens
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own oauth tokens"
  ON public.oauth_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el service role puede escribir (desde el backend)
-- (No creamos policy de INSERT/UPDATE para usuarios anónimos — 
--  el backend usa SUPABASE_SERVICE_ROLE_KEY que bypassa RLS)
