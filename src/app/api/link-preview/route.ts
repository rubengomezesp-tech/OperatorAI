import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { fetchHtml, extractMetaContent } from '@/lib/brand-os/url-extractor';

export const runtime = 'nodejs';
export const maxDuration = 15;

const BodySchema = z.object({
  url: z.string().url(),
});

export type LinkPreview = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
};

// Simple in-memory cache (per lambda) — 1h TTL
const cache = new Map<string, { data: LinkPreview; expires: number }>();
const TTL = 60 * 60 * 1000;

function resolveUrl(maybeRelative: string | undefined, base: string): string | undefined {
  if (!maybeRelative) return undefined;
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return undefined;
  }
}

function extractTitle(html: string): string | undefined {
  // Prefer og:title, then twitter:title, then <title>
  const og = extractMetaContent(html, 'og:title', 'property');
  if (og) return og;
  const tw = extractMetaContent(html, 'twitter:title');
  if (tw) return tw;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim();
}

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const { url } = parsed.data;

  // Cache check
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const html = await fetchHtml(url);

    const data: LinkPreview = {
      url,
      title:       extractTitle(html),
      description: extractMetaContent(html, 'og:description', 'property')
                || extractMetaContent(html, 'twitter:description')
                || extractMetaContent(html, 'description'),
      image:       resolveUrl(extractMetaContent(html, 'og:image', 'property')
                            || extractMetaContent(html, 'twitter:image'), url),
      siteName:    extractMetaContent(html, 'og:site_name', 'property')
                || new URL(url).hostname.replace(/^www\./, ''),
      favicon:     `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
    };

    cache.set(url, { data, expires: Date.now() + TTL });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Preview failed';
    return NextResponse.json({ error: message, url }, { status: 500 });
  }
}
