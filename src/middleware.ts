import { NextResponse, type NextRequest } from 'next/server';

export const config = {
  matcher: ['/api/:path*'],
};

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // CORS — only allow our domains
  const origin = req.headers.get('origin') ?? '';
  const allowed = [
    'https://operatoraiapp.com',
    'https://www.operatoraiapp.com',
    'https://operator-ai-delta.vercel.app',
    'http://localhost:3000',
  ];

  if (allowed.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  }

  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Max-Age', '86400');

  // Block non-browser automated requests without proper headers
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Rate limit header for clients
    res.headers.set('X-RateLimit-Policy', '60 per minute');

    // Prevent caching of API responses
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: res.headers });
  }

  return res;
}
