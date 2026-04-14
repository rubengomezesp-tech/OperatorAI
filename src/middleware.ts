import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { nanoid } from 'nanoid';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback', '/pricing', '/legal'];
const API_PUBLIC_PREFIXES = ['/api/health', '/api/webhooks', '/api/inngest'];

export async function middleware(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') ?? nanoid(12);
  const res = NextResponse.next({ request: { headers: new Headers(req.headers) } });
  res.headers.set('x-request-id', requestId);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) =>
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;

  const isPublic =
    PUBLIC_ROUTES.some((r) => path === r || path.startsWith(r + '/')) ||
    API_PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}
