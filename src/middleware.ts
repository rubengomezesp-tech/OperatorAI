import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|logo.png|manifest.json|sw.js).*)'],
};

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();

  // Refresh Supabase session on every request (keeps user logged in)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => {
              req.cookies.set(name, value);
              res = NextResponse.next({ request: req });
              res.cookies.set(name, value, options);
            });
          },
        },
      },
    );
    await supabase.auth.getUser();
  } catch {}

  // CORS — only for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin') ?? '';
    const allowed = [
      'https://operatoraiapp.com',
      'https://www.operatoraiapp.com',
      'https://operator-ai-delta.vercel.app',
      'http://localhost:3000',
      'capacitor://localhost',
      'ionic://localhost',
    ];

    if (allowed.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Rate limiting
    if (req.method !== 'OPTIONS') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
      const ok = checkRateLimit(ip);
      if (!ok) return rateLimitResponse();
    }

    // Security headers
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  return res;
}
