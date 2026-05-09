/**
 * 🔐 GET /api/auth/google/callback
 * 
 * Recibe el authorization code después de que el user autoriza.
 * Lo intercambia por tokens y los guarda en Supabase.
 * Después redirige al chat.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/orchestrator/tools/auth/oauth-google';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // Usuario denegó el consentimiento
  if (error) {
    console.warn('[oauth-google-callback] user denied:', error);
    return NextResponse.redirect(new URL('/chat?oauth_error=denied', req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/chat?oauth_error=no_code', req.url));
  }

  try {
    // Obtener el userId del usuario logueado
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      console.warn('[oauth-google-callback] no authenticated user');
      return NextResponse.redirect(new URL('/login?reason=oauth_no_user', req.url));
    }

    // Intercambiar code por tokens y guardarlos
    await exchangeCodeForTokens(code, user.id);
    console.log('[oauth-google-callback] ✅ tokens saved for user:', user.id);

    // Redirigir al chat con success
    return NextResponse.redirect(new URL('/chat?oauth_success=google', req.url));
  } catch (e) {
    console.error('[oauth-google-callback] error:', e);
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.redirect(
      new URL(`/chat?oauth_error=${encodeURIComponent(message)}`, req.url),
    );
  }
}
