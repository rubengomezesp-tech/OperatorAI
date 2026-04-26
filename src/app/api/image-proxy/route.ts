/**
 * Image proxy — secure version
 * 
 * Why this exists:
 *   Some services (Replicate, fal.ai) return URLs that have CORS restrictions
 *   or expire quickly. We proxy them to:
 *   - Add proper CORS headers
 *   - Strip auth tokens from the client
 *   - Cache aggressively
 * 
 * Security model:
 *   - Allowlist of trusted hosts (Replicate, Supabase, fal, OpenAI)
 *   - Block ALL private IP ranges (RFC1918, link-local, loopback)
 *   - Block AWS/GCP/Azure metadata endpoints
 *   - Block redirects to disallowed hosts (manual redirect handling)
 *   - Hard limits on response size
 *   - Only forward image/* MIME types
 *   - Timeout 15s
 */

import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'net';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ────────────────────────────────────────────────────────────────
// SECURITY CONFIG
// ────────────────────────────────────────────────────────────────

/**
 * Allowed hosts. Only these can be proxied.
 * Format: exact hostname OR ".domain.tld" for subdomain wildcards.
 */
const ALLOWED_HOSTS = [
  // Replicate (image model output CDN)
  'replicate.delivery',
  'pbxt.replicate.delivery',
  'tjzk.replicate.delivery',

  // fal.ai (image model output CDN)
  'fal.media',
  'storage.googleapis.com', // fal stores some outputs here
  'fal.run',
  'v3.fal.media',

  // OpenAI (DALL-E / GPT-Image temp URLs)
  'oaidalleapiprodscus.blob.core.windows.net',

  // Supabase (your own buckets)
  // Add your project ref(s) here:
  // euiobhkcbovmy
  // For now allow all *.supabase.co — controlled by RLS at storage level
  '.supabase.co',
  'euiobhkcbovmypwmvwgi.supabase.co',
  '.supabase.in',

  // Common CDNs (Unsplash for testing, your own CDN if any)
  'images.unsplash.com',

  // Google (Firecrawl logo extraction sometimes returns these)
  'lh3.googleusercontent.com',
];

const MAX_RESPONSE_BYTES = 25 * 1024 * 1024; // 25MB
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;

// ────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Step 1: Validate URL syntactically
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Step 2: Only http/https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only http(s) URLs are allowed' }, { status: 400 });
  }

  // Step 3: Hostname must be in allowlist
  if (!isHostAllowed(parsed.hostname)) {
    console.warn('[image-proxy] blocked disallowed host', {
      host: parsed.hostname,
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return NextResponse.json(
      { error: 'Host not in allowlist' },
      { status: 403 }
    );
  }

  // Step 4: Block private IPs (defense in depth — even if allowlist allows
  //         a domain, that domain could resolve to a private IP)
  if (await isPrivateOrInternal(parsed.hostname)) {
    console.warn('[image-proxy] blocked private/internal address', {
      host: parsed.hostname,
    });
    return NextResponse.json(
      { error: 'Internal addresses are not allowed' },
      { status: 403 }
    );
  }

  // Step 5: Fetch with manual redirect handling and size limit
  try {
    const result = await fetchWithSafety(parsed.toString(), {
      timeoutMs: FETCH_TIMEOUT_MS,
      maxBytes: MAX_RESPONSE_BYTES,
      maxRedirects: MAX_REDIRECTS,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${result.status}` },
        { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
      );
    }

    // Step 6: Validate Content-Type — only forward image/*
    const contentType = result.contentType ?? '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: `Unexpected content type: ${contentType}` },
        { status: 415 }
      );
    }

    // Step 7: Return with safe headers
    return new NextResponse(new Uint8Array(result.body), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[image-proxy] fetch failed', {
      url: parsed.toString(),
      error: message,
    });
    return NextResponse.json(
      { error: `Failed to fetch image: ${message}` },
      { status: 502 }
    );
  }
}

// ────────────────────────────────────────────────────────────────
// HOST ALLOWLIST CHECK
// ────────────────────────────────────────────────────────────────

function isHostAllowed(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();

  for (const allowed of ALLOWED_HOSTS) {
    if (allowed.startsWith('.')) {
      // Subdomain wildcard — match any host ending with this
      if (lower.endsWith(allowed) || lower === allowed.substring(1)) {
        return true;
      }
    } else {
      // Exact match
      if (lower === allowed.toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}

// ────────────────────────────────────────────────────────────────
// PRIVATE IP CHECK (defense in depth against DNS rebinding)
// ────────────────────────────────────────────────────────────────

/**
 * Check if a hostname resolves to a private/internal address.
 * Uses Node's dns.lookup() to resolve, then checks against blocklist.
 *
 * Blocks:
 * - RFC1918 (10/8, 172.16/12, 192.168/16)
 * - Loopback (127/8, ::1)
 * - Link-local (169.254/16, fe80::/10) — includes AWS/GCP metadata
 * - CGNAT (100.64/10)
 * - Documentation (192.0.2/24, 198.51.100/24, 203.0.113/24)
 * - Multicast (224/4, ff00::/8)
 */
async function isPrivateOrInternal(hostname: string): Promise<boolean> {
  // Quick bail for IP literals (no DNS lookup needed)
  if (isIP(hostname) !== 0) {
    return isPrivateIp(hostname);
  }

  // Quick bail for obvious internal hostnames
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.endsWith('.localhost')
  ) {
    return true;
  }

  // DNS lookup
  try {
    const dns = await import('dns/promises');
    const records = await dns.lookup(hostname, { all: true });

    for (const record of records) {
      if (isPrivateIp(record.address)) {
        return true;
      }
    }
    return false;
  } catch {
    // DNS lookup failed — be conservative and block
    return true;
  }
}

function isPrivateIp(ip: string): boolean {
  // IPv6 checks
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true; // loopback
    if (lower.startsWith('fe80:')) return true; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('ff')) return true; // multicast
    if (lower === '::') return true; // unspecified
    return false;
  }

  // IPv4 checks
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true; // malformed

  const [a, b] = parts;

  // RFC1918
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;

  // Loopback
  if (a === 127) return true;

  // Link-local (includes 169.254.169.254 — AWS/GCP metadata)
  if (a === 169 && b === 254) return true;

  // CGNAT (carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // Documentation
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;

  // Multicast / broadcast
  if (a >= 224 && a <= 255) return true;

  // Unspecified
  if (a === 0) return true;

  return false;
}

// ────────────────────────────────────────────────────────────────
// SAFE FETCH — with manual redirect, timeout, and size limit
// ────────────────────────────────────────────────────────────────

interface SafeFetchResult {
  ok: boolean;
  status: number;
  contentType?: string;
  body: ArrayBuffer;
}

async function fetchWithSafety(
  url: string,
  options: { timeoutMs: number; maxBytes: number; maxRedirects: number }
): Promise<SafeFetchResult> {
  let currentUrl = url;
  let redirects = 0;

  while (redirects <= options.maxRedirects) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        // Manual redirect — we want to validate each hop against allowlist
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OperatorAI-ImageProxy/1.0)',
          Accept: 'image/*',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    // Handle redirect
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return {
          ok: false,
          status: response.status,
          body: new ArrayBuffer(0),
        };
      }

      // Resolve relative redirects
      const nextUrl = new URL(location, currentUrl);

      // Re-validate the redirect target
      if (
        (nextUrl.protocol !== 'http:' && nextUrl.protocol !== 'https:') ||
        !isHostAllowed(nextUrl.hostname) ||
        (await isPrivateOrInternal(nextUrl.hostname))
      ) {
        throw new Error(`Redirect to disallowed host blocked: ${nextUrl.hostname}`);
      }

      currentUrl = nextUrl.toString();
      redirects++;
      continue;
    }

    // Non-redirect: read body with size cap
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        contentType: response.headers.get('content-type') ?? undefined,
        body: new ArrayBuffer(0),
      };
    }

    // Check Content-Length header (cheap pre-check)
    const declaredLength = response.headers.get('content-length');
    if (declaredLength && parseInt(declaredLength, 10) > options.maxBytes) {
      throw new Error(
        `Response too large: declared ${declaredLength} bytes (max ${options.maxBytes})`
      );
    }

    // Read body with hard cap
    const reader = response.body?.getReader();
    if (!reader) {
      const buf = await response.arrayBuffer();
      if (buf.byteLength > options.maxBytes) {
        throw new Error(`Response too large: ${buf.byteLength} bytes`);
      }
      return {
        ok: true,
        status: response.status,
        contentType: response.headers.get('content-type') ?? undefined,
        body: buf,
      };
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > options.maxBytes) {
        await reader.cancel();
        throw new Error(`Response too large: exceeded ${options.maxBytes} bytes`);
      }
      chunks.push(value);
    }

    const merged = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return {
      ok: true,
      status: response.status,
      contentType: response.headers.get('content-type') ?? undefined,
      body: merged.buffer.slice(merged.byteOffset, merged.byteOffset + merged.byteLength),
    };
  }

  throw new Error(`Too many redirects (max ${options.maxRedirects})`);
}
