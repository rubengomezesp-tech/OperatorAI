import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Image proxy to bypass CORS/Safari cross-origin blocking.
 * Fetches external images (replicate.delivery, Supabase, etc) and returns
 * them with proper headers so all browsers can load them.
 *
 * Usage: /api/image-proxy?url=https://replicate.delivery/...
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Security: only allow http/https, prevent local URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return NextResponse.json(
      { error: 'Invalid URL scheme' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(url, {
      // User-Agent required by some services (including Replicate)
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OperatorAI/1.0)',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[image-proxy] fetch failed', {
      url,
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 502 }
    );
  }
}
