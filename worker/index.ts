/**
 * Worker entrypoint.
 *
 * Run with:
 *   pnpm worker:dev   (dev with tsx + watch)
 *   pnpm worker:start (production after build)
 *
 * Add to package.json scripts:
 *   "worker:dev": "tsx watch worker/index.ts",
 *   "worker:start": "node dist/worker/index.js"
 *
 * Deploy as a separate service on Railway / Render / Fly.io.
 */

import { startWorkers } from '@/lib/queue';
import { createClient } from '@supabase/supabase-js';

// ⚠️ Replace with your actual service-role Supabase client factory
function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('[worker] Booting Operator AI worker...');

  const cleanup = startWorkers(createSupabaseServiceClient);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[worker] Received ${signal}, shutting down...`);
    await cleanup();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // eslint-disable-next-line no-console
  console.log('[worker] Ready. Listening for jobs.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[worker] Fatal error:', err);
  process.exit(1);
});
