/**
 * Operator AI — Model Router
 * Phase 2 / Replicate client
 *
 * We use Replicate for:
 * - Real-ESRGAN upscaling
 * - Legacy Flux access (already in your code)
 *
 * fal.ai is preferred for new model integrations (cheaper, faster cold-starts).
 */

import type { ModelId } from './types';
import { ModelRenderError, ModelTimeoutError } from './types';

const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_RETRIES = 2;

let cachedReplicate: any = null;

async function getReplicate() {
  if (cachedReplicate) return cachedReplicate;

  const Replicate = (await import('replicate')).default;
  const auth = process.env.REPLICATE_API_TOKEN;

  if (!auth) {
    throw new Error('REPLICATE_API_TOKEN env var is not set');
  }

  cachedReplicate = new Replicate({ auth });
  return cachedReplicate;
}

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface ReplicateCallParams {
  modelId: ModelId;
  /** Replicate model identifier, e.g. "nightmareai/real-esrgan" */
  model: string;
  /** Specific version hash (recommended for production stability) */
  version?: string;
  /** Input payload */
  input: Record<string, unknown>;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface ReplicateCallResult {
  imageUrl: string;
  imageUrls: string[];
  raw: unknown;
  durationMs: number;
  requestId?: string;
}

export async function replicateCall(params: ReplicateCallParams): Promise<ReplicateCallResult> {
  const start = Date.now();
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = params.maxRetries ?? DEFAULT_MAX_RETRIES;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const replicate = await getReplicate();

      const racePromise = Promise.race([
        params.version
          ? replicate.run(`${params.model}:${params.version}`, { input: params.input })
          : replicate.run(params.model, { input: params.input }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
        ),
      ]);

      const result = await racePromise;
      return extractReplicateResult(result, start, params.modelId);
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === maxRetries;
      const isTimeout = (err as Error)?.message === 'TIMEOUT';

      if (isLastAttempt) {
        if (isTimeout) {
          throw new ModelTimeoutError(params.modelId, 'replicate', timeoutMs);
        }
        throw new ModelRenderError(
          params.modelId,
          'replicate',
          `Replicate call failed: ${(err as Error).message}`,
          err
        );
      }

      const backoff = 500 * Math.pow(3, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  throw new ModelRenderError(
    params.modelId,
    'replicate',
    `Unreachable: Replicate call exhausted retries`,
    lastError
  );
}

function extractReplicateResult(
  rawResult: any,
  startMs: number,
  modelId: ModelId
): ReplicateCallResult {
  // Replicate returns:
  // - String URL for single-output models
  // - Array of URLs for multi-output
  // - Object with output field for some models
  let imageUrls: string[] = [];

  if (typeof rawResult === 'string') {
    imageUrls = [rawResult];
  } else if (Array.isArray(rawResult)) {
    imageUrls = rawResult.filter((x) => typeof x === 'string');
  } else if (rawResult?.output) {
    imageUrls = Array.isArray(rawResult.output) ? rawResult.output : [rawResult.output];
  }

  if (imageUrls.length === 0) {
    throw new ModelRenderError(
      modelId,
      'replicate',
      `Replicate returned no images. Raw: ${JSON.stringify(rawResult).substring(0, 200)}`
    );
  }

  return {
    imageUrl: imageUrls[0],
    imageUrls,
    raw: rawResult,
    durationMs: Date.now() - startMs,
  };
}
