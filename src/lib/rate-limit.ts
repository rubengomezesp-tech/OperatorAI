import { NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter.
 * For production at scale, use Upstash Redis rate limiting.
 */
const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const LIMITS: Record<string, number> = {
  '/api/chat': 30,           // 30 messages per minute
  '/api/images/generate': 10, // 10 images per minute
  '/api/billing/checkout': 5, // 5 checkout attempts per minute
  '/api/files/upload': 10,    // 10 uploads per minute
  default: 60,                // 60 requests per minute for other endpoints
};

export function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = ip + ':' + path;
  const limit = LIMITS[path] ?? LIMITS.default;

  const record = requests.get(key);
  if (!record || now > record.resetAt) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1 };
  }

  record.count++;
  if (record.count > limit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - record.count };
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Too many requests. Please wait a moment.' },
    {
      status: 429,
      headers: { 'Retry-After': '60' },
    },
  );
}

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of requests) {
      if (now > val.resetAt) requests.delete(key);
    }
  }, 300_000);
}
