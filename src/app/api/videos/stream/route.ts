import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: 'Fetch failed' }, { status: res.status });

    const headers = new Headers();
    headers.set('Content-Type', res.headers.get('content-type') || 'video/mp4');
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(res.body, { headers });
  } catch {
    return NextResponse.json({ error: 'Stream failed' }, { status: 500 });
  }
}
