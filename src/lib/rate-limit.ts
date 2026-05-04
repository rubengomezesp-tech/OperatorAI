import { NextResponse } from 'next/server';

/**
 * Rate limiter en memoria.
 * Para producción a escala, migrar a Upstash Redis.
 */
const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const LIMITS: Record<string, number> = {
  '/api/chat': 30,
  '/api/images/generate': 10,
  '/api/billing/checkout': 5,
  '/api/files/upload': 10,
  default: 60,
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
    { status: 429, headers: { 'Retry-After': '60' } },
  );
}

// Limpieza cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of requests) {
      if (now > val.resetAt) requests.delete(key);
    }
  }, 300_000);
}
