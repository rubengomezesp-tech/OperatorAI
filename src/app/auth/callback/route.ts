import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Auth callback — handles OAuth, email confirmation, and password recovery.
 * Forces cookie-aware session exchange.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const type = url.searchParams.get('type');
  const explicitNext = url.searchParams.get('next');
  const errorParam = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Si Supabase mandó error directamente
  if (errorParam) {
    console.error('[auth/callback] OAuth error:', errorParam, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=oauth_${errorParam}`, req.url));
  }

  const isRecovery = type === 'recovery';
  const next = isRecovery ? '/reset-password' : (explicitNext ?? '/chat');

  if (!code) {
    // Si no hay code y es recovery por email click directo
    if (isRecovery) {
      return NextResponse.redirect(new URL('/reset-password', req.url));
    }
    console.error('[auth/callback] No code provided');
    return NextResponse.redirect(new URL('/login?error=no_code', req.url));
  }

  // Crear el response final ANTES de exchange, para que las cookies se peguen ahí
  const response = NextResponse.redirect(new URL(next, req.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  console.log('[auth/callback] exchange result:', {
    hasError: !!error,
    errorMsg: error?.message,
    hasUser: !!data?.user,
    userEmail: data?.user?.email,
    cookiesSet: response.cookies.getAll().map(c => c.name),
  });

  if (error) {
    console.error('[auth/callback] exchange error:', error.message);
    if (isRecovery) {
      return NextResponse.redirect(new URL('/forgot-password?error=expired', req.url));
    }
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));
  }

  return response;
}
