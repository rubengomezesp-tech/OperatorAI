/**
 * Operator AI — Model Router
 * Phase 2 / fal.ai shared client
 *
 * fal.ai serves most of our image models (Flux, Ideogram, Recraft, Imagen).
 * This module provides a thin wrapper around the official @fal-ai/client.
 *
 * Why a shared client:
 * - Single retry/timeout policy
 * - Single auth (FAL_KEY env var)
 * - Single observability surface (latency, cost, errors)
 * - Easy to mock for tests
 *
 * Note: This module imports @fal-ai/client lazily to avoid forcing
 * the dep on environments that don't use fal (e.g. self-hosted).
 */

import type { ModelId } from './types';
import { ModelRenderError, ModelTimeoutError } from './types';

// ────────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 2;

interface FalConfig {
  apiKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

let cachedFalClient: any = null;

/**
 * Lazy import of fal client. Avoids loading the SDK if no fal model is used.
 */
async function getFalClient(config: FalConfig = {}) {
  if (cachedFalClient) return cachedFalClient;

  // Lazy import — reduces bundle size if fal isn't used
  const { fal } = await import('@fal-ai/client');

  const apiKey = config.apiKey ?? process.env.FAL_KEY ?? process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new Error('FAL_KEY env var is not set');
  }

  fal.config({ credentials: apiKey });
  cachedFalClient = fal;
  return fal;
}

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface FalCallParams {
  /** Model ID (for error reporting) */
  modelId: ModelId;
  /** fal endpoint path, e.g. "fal-ai/flux-pro/v1.1" */
  endpoint: string;
  /** Input payload (model-specific) */
  input: Record<string, unknown>;
  /** Timeout in ms */
  timeoutMs?: number;
  /** Max retries */
  maxRetries?: number;
}

export interface FalCallResult {
  /** First image URL from the result */
  imageUrl: string;
  /** All image URLs (some models return multiple) */
  imageUrls: string[];
  /** Final width / height as reported by fal */
  width?: number;
  height?: number;
  /** Request ID for debugging */
  requestId?: string;
  /** Raw response */
  raw: unknown;
  /** Time spent in ms */
  durationMs: number;
}

/**
 * Call any fal endpoint with retry + timeout + standardized output extraction.
 */
export async function falCall(params: FalCallParams): Promise<FalCallResult> {
  const start = Date.now();
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = params.maxRetries ?? DEFAULT_MAX_RETRIES;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const fal = await getFalClient();

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const result = await fal.subscribe(params.endpoint, {
        input: params.input,
        logs: false,
        // signal: controller.signal, // fal client supports this in newer versions
      });

      clearTimeout(timeout);

      return extractFalResult(result, start, params.modelId);
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === maxRetries;
      const isTimeout = (err as Error)?.name === 'AbortError';

      if (isLastAttempt) {
        if (isTimeout) {
          throw new ModelTimeoutError(params.modelId, 'fal', timeoutMs);
        }
        throw new ModelRenderError(
          params.modelId,
          'fal',
          `fal call failed after ${maxRetries + 1} attempts: ${(err as Error).message}`,
          err
        );
      }

      // Exponential backoff: 500ms, 1500ms
      const backoff = 500 * Math.pow(3, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  throw new ModelRenderError(
    params.modelId,
    'fal',
    `Unreachable: fal call exhausted retries`,
    lastError
  );
}

// ────────────────────────────────────────────────────────────────
// RESULT EXTRACTION
// ────────────────────────────────────────────────────────────────

function extractFalResult(rawResult: any, startMs: number, modelId: ModelId): FalCallResult {
  // fal results have shape { data: {...}, requestId: "..." }
  const data = rawResult?.data ?? rawResult;
  const requestId = rawResult?.requestId;

  // Most fal models return { images: [{ url, width, height }] }
  const images = data?.images ?? data?.image ? [data.image] : data?.output ? [{ url: data.output }] : [];

  if (!images || images.length === 0) {
    throw new ModelRenderError(
      modelId,
      'fal',
      `fal returned no images. Raw: ${JSON.stringify(data).substring(0, 200)}`
    );
  }

  const first = images[0];
  const imageUrls = images.map((img: any) => img.url ?? img).filter(Boolean);

  return {
    imageUrl: first.url ?? first,
    imageUrls,
    width: first.width,
    height: first.height,
    requestId,
    raw: rawResult,
    durationMs: Date.now() - startMs,
  };
}

// ────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ────────────────────────────────────────────────────────────────

export async function falHealthcheck(): Promise<{ healthy: boolean; latencyMs?: number }> {
  const start = Date.now();
  try {
    await getFalClient();
    return { healthy: true, latencyMs: Date.now() - start };
  } catch {
    return { healthy: false };
  }
}
