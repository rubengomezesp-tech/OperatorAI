import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

/**
 * Rate limiter basado en Upstash Redis.
 * Escalable entre instancias serverless.
 */

// Singleton Redis client - Upstash acepta url + token por separado
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL no configurada');
    }
    
    // Extraer token de la URL rediss://
    // Formato: rediss://default:TOKEN@HOST:6379
    let token = '';
    try {
      const urlObj = new URL(url);
      token = urlObj.password || '';
    } catch {
      // Si no se puede parsear, usar variable separada
      token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
    }
    
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || url.replace('rediss://', 'https://'),
      token,
    });
  }
  return redis;
}

// Límites por endpoint
const LIMITS: Record<string, { max: number; window: number }> = {
  '/api/chat':               { max: 30, window: 60 },    // 30 msg/min
  '/api/chat-guest':         { max: 10, window: 60 },    // 10 msg/min (guest)
  '/api/images/generate':    { max: 15, window: 60 },    // 15 img/min
  '/api/ads/create':         { max: 10, window: 60 },    // 10 ads/min
  '/api/ads/brief':          { max: 20, window: 60 },    // 20 briefs/min
  '/api/billing/checkout':   { max: 5,  window: 60 },    // 5 checkouts/min
  '/api/files/upload':       { max: 10, window: 60 },    // 10 uploads/min
  '/api/memory/create':      { max: 30, window: 60 },
  '/api/knowledge/process':  { max: 10, window: 60 },
  '/api/videos/generate':    { max: 5,  window: 60 },    // 5 videos/min (caros)
  default:                   { max: 60, window: 60 },    // 60 req/min resto
};

// IPs baneadas temporalmente (abusos detectados)
const BANNED_IPS = new Set<string>();
const BAN_DURATION = 300; // 5 minutos

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

export async function checkRateLimit(
  ip: string,
  path: string,
): Promise<RateLimitResult> {
  // 1. Verificar si la IP está baneada
  if (BANNED_IPS.has(ip)) {
    return { allowed: false, remaining: 0, reset: Date.now() + BAN_DURATION * 1000, limit: 0 };
  }

  const { max, window } = LIMITS[path] || LIMITS.default;
  const now = Math.floor(Date.now() / 1000);
  const key = `ratelimit:${ip}:${path}`;

  try {
    const r = getRedis();
    
    const requests = await r.incr(key);
    
    if (requests === 1) {
      await r.expire(key, window);
    }

    const ttl = await r.ttl(key);
    const remaining = Math.max(0, max - requests);
    const reset = now + ttl;

    // Detectar abuso: si excede el límite por 2x, banear temporalmente
    if (requests > max * 2) {
      BANNED_IPS.add(ip);
      setTimeout(() => BANNED_IPS.delete(ip), BAN_DURATION * 1000);
      console.warn(`[rate-limit] IP baneada temporalmente: ${ip} (${path})`);
      return { allowed: false, remaining: 0, reset, limit: max };
    }

    if (requests > max) {
      console.info(`[rate-limit] Rate limit alcanzado: ${ip} ${path} (${requests}/${max})`);
      return { allowed: false, remaining: 0, reset, limit: max };
    }

    return { allowed: true, remaining, reset, limit: max };
  } catch (error) {
    // Fail open: si Redis falla, permitir la request
    console.error('[rate-limit] Redis error, permitiendo request:', error);
    return { allowed: true, remaining: 1, reset: now + 60, limit: max };
  }
}

export function banIP(ip: string): void {
  BANNED_IPS.add(ip);
  setTimeout(() => BANNED_IPS.delete(ip), BAN_DURATION * 1000);
  console.info(`[rate-limit] IP baneada manualmente: ${ip}`);
}

export function unbanIP(ip: string): void {
  BANNED_IPS.delete(ip);
  console.info(`[rate-limit] IP desbaneada: ${ip}`);
}

export function rateLimitResponse(result?: RateLimitResult) {
  const retryAfter = result ? Math.ceil((result.reset - Date.now() / 1000)) : 60;
  
  return NextResponse.json(
    {
      error: 'Demasiadas solicitudes. Espera un momento.',
      retryAfter: `${retryAfter} segundos`,
      limit: result?.limit,
      remaining: result?.remaining ?? 0,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result?.limit ?? 0),
        'X-RateLimit-Remaining': String(result?.remaining ?? 0),
        'X-RateLimit-Reset': String(result?.reset ?? 0),
      },
    },
  );
}

export async function resetRateLimit(ip: string, path?: string): Promise<void> {
  try {
    const r = getRedis();
    if (path) {
      await r.del(`ratelimit:${ip}:${path}`);
    } else {
      const keys = await r.keys(`ratelimit:${ip}:*`);
      if (keys.length > 0) {
        await r.del(...keys);
      }
    }
  } catch (error) {
    console.error('[rate-limit] Error al resetear:', error);
  }
}
