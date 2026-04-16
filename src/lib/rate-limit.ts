/**
 * Simple in-memory rate limiter for API routes.
 * In production with multiple Vercel functions, use Vercel KV or Upstash Redis.
 * This provides basic protection against abuse.
 */
const rateMap = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateMap) {
    if (val.resetAt < now) rateMap.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds
}

/**
 * Check if a request is within rate limits.
 * @param key - Unique identifier (e.g., userId, IP)
 * @param maxRequests - Max requests per window
 * @param windowMs - Time window in milliseconds (default 60s)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: Math.ceil(windowMs / 1000) };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed: entry.count <= maxRequests,
    remaining,
    resetIn,
  };
}
