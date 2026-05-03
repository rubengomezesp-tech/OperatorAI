import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Auth callback — handles OAuth, email confirmation, and password recovery.
 *
 * Supabase puede redirigir aquí con:
 *   - ?code=XXX           → OAuth / email confirm → vamos a /chat (o ?next=...)
 *   - ?code=XXX&type=recovery → reset password    → vamos a /reset-password
 *   - ?type=recovery (sin code) → reset password tras click email
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const type = url.searchParams.get('type');
  const explicitNext = url.searchParams.get('next');

  // Si es recovery → forzar a /reset-password
  const isRecovery = type === 'recovery';
  const next = isRecovery ? '/reset-password' : (explicitNext ?? '/chat');

  if (code) {
    const db = await createSupabaseServerClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) {
      // Si falla el exchange en recovery, mandar a forgot-password con error
      if (isRecovery) {
        return NextResponse.redirect(new URL('/forgot-password?error=expired', req.url));
      }
      return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
