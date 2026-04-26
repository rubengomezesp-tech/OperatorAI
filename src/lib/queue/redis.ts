/**
 * Operator AI — Job Queue
 * Phase 4 / Redis client
 *
 * Provides ioredis connection used by BullMQ.
 * Supports:
 * - Upstash Redis (REDIS_URL=rediss://...)
 * - Local Redis (REDIS_URL=redis://localhost:6379)
 * - Vercel KV (compatible with Redis URL format)
 *
 * Connection is lazy-initialized and cached.
 */

import IORedis from 'ioredis';

let cachedClient: IORedis | null = null;

/**
 * Get a Redis client. Connection is shared across all queues.
 * Throws if REDIS_URL is not set.
 */
export function getRedisClient(): IORedis {
  if (cachedClient) return cachedClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      'REDIS_URL env var is not set. Required for BullMQ queue. ' +
        'Get one free at https://upstash.com/redis or run `redis-server` locally.'
    );
  }

  cachedClient = new IORedis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,    // Required by BullMQ
    // TLS for Upstash (rediss://)
    ...(url.startsWith('rediss://') && {
      tls: {
        rejectUnauthorized: false,
      },
    }),
  });

  cachedClient.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[redis] connection error:', err.message);
  });

  return cachedClient;
}

/**
 * Health check for monitoring.
 */
export async function redisHealthcheck(): Promise<{ healthy: boolean; latencyMs?: number }> {
  const start = Date.now();
  try {
    const client = getRedisClient();
    await client.ping();
    return { healthy: true, latencyMs: Date.now() - start };
  } catch {
    return { healthy: false };
  }
}

/**
 * Close connection (used in tests or graceful shutdown).
 */
export async function closeRedis(): Promise<void> {
  if (cachedClient) {
    await cachedClient.quit();
    cachedClient = null;
  }
}
