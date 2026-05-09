/**
 * 🛡️ RATE LIMITER — Upstash Redis-based
 * 
 * Funciona en Vercel serverless (estado distribuido en Redis edge).
 * Por user_id si hay sesión, por IP si no.
 * 
 * Uso:
 *   const { allowed, remaining } = await checkRateLimit(userId, '/api/chat');
 *   if (!allowed) return rateLimitResponse(remaining);
 */

import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Configuración por endpoint ───────────────────────────────
// Límites: requests permitidas por ventana (60 segundos)
const LIMITS: Record<string, number> = {
  '/api/chat': 30,             // Conversaciones (LLM tokens)
  '/api/images/generate': 10,  // Generación imagen ($0.10-0.20 c/u)
  '/api/videos/generate': 5,   // Generación vídeo ($0.50+ c/u)
  '/api/billing/checkout': 5,  // Stripe abuse prevention
  '/api/files/upload': 10,     // Storage abuse
  default: 60,                  // Endpoints normales
};

// ─── Upstash Redis client (lazy init) ─────────────────────────
let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('[rate-limit] Upstash no configurado, rate limit DISABLED');
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(path: string): Ratelimit | null {
  if (limiters.has(path)) return limiters.get(path)!;
  const r = getRedis();
  if (!r) return null;
  const limit = LIMITS[path] ?? LIMITS.default;
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, '60 s'),
    analytics: true,
    prefix: `ratelimit:${path}`,
  });
  limiters.set(path, limiter);
  return limiter;
}

/**
 * Check rate limit por usuario (o IP) y endpoint.
 * 
 * Si Upstash no está configurado, permite todas las requests
 * (modo desarrollo). NUNCA bloquea por error de infraestructura.
 */
export async function checkRateLimit(
  identifier: string,
  path: string,
): Promise<{ allowed: boolean; remaining: number; reset?: number }> {
  try {
    const limiter = getLimiter(path);
    if (!limiter) {
      // Sin Upstash → permitir (no romper UX)
      return { allowed: true, remaining: 999 };
    }

    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (e) {
    // Si Redis falla, permitir (failsafe — no romper producción)
    console.error('[rate-limit] error, allowing request:', e);
    return { allowed: true, remaining: 999 };
  }
}

/**
 * Response 429 estándar para cuando se supera el límite.
 */
export function rateLimitResponse(remaining = 0, resetAt?: number) {
  const retryAfter = resetAt
    ? Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
    : 60;
  return NextResponse.json(
    {
      error: 'Too many requests. Please wait a moment.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': String(remaining),
      },
    },
  );
}
