/**
 * 🔐 TOKEN STORE — Almacenamiento seguro de OAuth tokens en Supabase
 * 
 * Guarda access tokens + refresh tokens por usuario y por servicio.
 * Tabla: oauth_tokens (provider, user_id, access_token, refresh_token, expires_at)
 */

import { createSupabaseServiceClient } from '@/lib/supabase/service';

export interface OAuthTokens {
  provider: 'google' | 'slack' | 'github' | 'notion';
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

const TABLE = 'oauth_tokens';

/**
 * Guarda tokens (upsert por provider + userId).
 */
export async function saveTokens(tokens: OAuthTokens): Promise<void> {
  const svc = createSupabaseServiceClient();
  const { error } = await (svc as unknown as {
    from: (t: string) => {
      upsert: (row: Record<string, unknown>, opts?: object) => Promise<{ error: unknown }>;
    };
  })
    .from(TABLE)
    .upsert(
      {
        provider: tokens.provider,
        user_id: tokens.userId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt?.toISOString(),
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider,user_id' },
    );

  if (error) {
    console.warn('[token-store] save error:', error);
    throw new Error('Failed to save OAuth tokens');
  }
}

/**
 * Recupera tokens por provider + userId.
 */
export async function getTokens(
  provider: OAuthTokens['provider'],
  userId: string,
): Promise<OAuthTokens | null> {
  const svc = createSupabaseServiceClient();
  const { data, error } = await (svc as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
          };
        };
      };
    };
  })
    .from(TABLE)
    .select('*')
    .eq('provider', provider)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    provider: data.provider as OAuthTokens['provider'],
    userId: data.user_id as string,
    accessToken: data.access_token as string,
    refreshToken: (data.refresh_token as string) || undefined,
    expiresAt: data.expires_at ? new Date(data.expires_at as string) : undefined,
    scope: (data.scope as string) || undefined,
  };
}

/**
 * Elimina tokens (logout / revoke).
 */
export async function deleteTokens(
  provider: OAuthTokens['provider'],
  userId: string,
): Promise<void> {
  const svc = createSupabaseServiceClient();
  await (svc as unknown as {
    from: (t: string) => {
      delete: () => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => Promise<{ error: unknown }>;
        };
      };
    };
  })
    .from(TABLE)
    .delete()
    .eq('provider', provider)
    .eq('user_id', userId);
}

// ─── Migration SQL ────────────────────────────────────────────────
export const MIGRATION_SQL = `
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

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_lookup 
  ON public.oauth_tokens(provider, user_id);
`;
