import 'server-only';
import Replicate from 'replicate';
import { serverEnv } from '@/lib/env';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface GenerateInput {
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
  seed?: number;
  referenceImageUrls?: string[];
  model?: 'flux-2-pro' | 'flux-1.1-pro';
  negativePrompt?: string;
}

export interface GenerateOutput {
  urls: string[];
  seed: number;
  latencyMs: number;
  attempts: number;
}

export class FluxError extends Error {
  code: 'RATE_LIMITED' | 'TIMEOUT' | 'GENERATION_FAILED' | 'INVALID_OUTPUT' | 'UNKNOWN';
  status?: number;
  constructor(
    message: string,
    code: FluxError['code'],
    status?: number,
  ) {
    super(message);
    this.name = 'FluxError';
    this.code = code;
    this.status = status;
  }
}

// ═══════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════

const ASPECT_TO_SIZE: Record<string, { w: number; h: number }> = {
  '1:1': { w: 1024, h: 1024 },
  '16:9': { w: 1344, h: 768 },
  '9:16': { w: 768, h: 1344 },
  '4:5': { w: 896, h: 1120 },
  '3:2': { w: 1216, h: 832 },
};

const MODEL_TO_VERSION: Record<string, `${string}/${string}`> = {
  'flux-2-pro': 'black-forest-labs/flux-1.1-pro',
  'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
};

// Retry + polling policy
const MAX_ATTEMPTS = 4; // initial + 3 retries
const BASE_BACKOFF_MS = 2000; // 2s, 4s, 8s, 16s with jitter
const MAX_BACKOFF_MS = 30000;
const POLL_INTERVAL_MS = 3000; // 3s between polls (vs 500ms default of SDK)
const POLL_TIMEOUT_MS = 180000; // 3 minutes hard ceiling per prediction

// ═══════════════════════════════════════════════════════════
// Main entry
// ═══════════════════════════════════════════════════════════

/**
 * Generate an image with Flux via Replicate.
 *
 * Key differences vs naive client.run():
 * - Manual prediction create + poll (controlled polling interval).
 * - Exponential backoff with jitter on 429 rate-limit responses.
 * - Strict typing of errors via FluxError with codes for caller handling.
 * - Hard timeout per prediction (3 min) to prevent runaway Vercel invocations.
 * - Logs include attempt count and timing for observability.
 */
export async function generateWithFlux(
  input: GenerateInput,
): Promise<GenerateOutput> {
  if (!serverEnv.REPLICATE_API_TOKEN) {
    throw new FluxError('REPLICATE_API_TOKEN not set', 'UNKNOWN');
  }

  const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });
  const started = Date.now();
  const seed = input.seed ?? Math.floor(Math.random() * 2147483647);
  const size =
    ASPECT_TO_SIZE[input.aspectRatio] ?? ASPECT_TO_SIZE['1:1'];

  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    width: size.w,
    height: size.h,
    output_format: 'png',
    seed,
  };

  if (input.referenceImageUrls && input.referenceImageUrls.length > 0) {
    payload.input_images = input.referenceImageUrls.slice(0, 8);
  }

  if (input.negativePrompt && input.negativePrompt.trim().length > 0) {
    payload.negative_prompt = input.negativePrompt.trim();
  }

  const modelKey = input.model || 'flux-2-pro';
  const versionedModel = MODEL_TO_VERSION[modelKey] || MODEL_TO_VERSION['flux-2-pro'];

  let lastError: FluxError | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const prediction = await client.predictions.create({
        model: versionedModel,
        input: payload,
      });

      const output = await pollPrediction(client, prediction.id);
      const urls = extractUrls(output);

      if (urls.length === 0) {
        throw new FluxError(
          'Flux returned no URLs in output',
          'INVALID_OUTPUT',
        );
      }

      console.log(
        '[flux] success',
        JSON.stringify({
          attempt: attempt + 1,
          latencyMs: Date.now() - started,
          model: modelKey,
          seed,
          urls: urls.length,
        }),
      );

      return {
        urls,
        seed,
        latencyMs: Date.now() - started,
        attempts: attempt + 1,
      };
    } catch (err) {
      const fluxErr = toFluxError(err);
      lastError = fluxErr;

      // Non-retryable errors: bail immediately
      if (
        fluxErr.code === 'INVALID_OUTPUT' ||
        fluxErr.code === 'GENERATION_FAILED'
      ) {
        console.error(
          '[flux] non-retryable error',
          JSON.stringify({ attempt: attempt + 1, code: fluxErr.code, message: fluxErr.message }),
        );
        throw fluxErr;
      }

      // Retryable: 429 / timeout / transient
      if (attempt < MAX_ATTEMPTS - 1) {
        const backoff = computeBackoff(attempt);
        console.warn(
          '[flux] retryable error, backing off',
          JSON.stringify({
            attempt: attempt + 1,
            code: fluxErr.code,
            backoffMs: backoff,
            message: fluxErr.message,
          }),
        );
        await sleep(backoff);
        continue;
      }

      console.error(
        '[flux] exhausted retries',
        JSON.stringify({ attempts: MAX_ATTEMPTS, code: fluxErr.code, message: fluxErr.message }),
      );
      throw fluxErr;
    }
  }

  throw lastError || new FluxError('Flux generation failed', 'UNKNOWN');
}

// ═══════════════════════════════════════════════════════════
// Polling
// ═══════════════════════════════════════════════════════════

async function pollPrediction(
  client: Replicate,
  predictionId: string,
): Promise<unknown> {
  const start = Date.now();

  // First fetch to check initial status (reduces one poll in fast paths)
  let prediction = await client.predictions.get(predictionId);

  while (
    prediction.status === 'starting' ||
    prediction.status === 'processing'
  ) {
    if (Date.now() - start > POLL_TIMEOUT_MS) {
      // Best-effort cancel
      try {
        await client.predictions.cancel(predictionId);
      } catch {
        /* ignore */
      }
      throw new FluxError(
        'Flux prediction exceeded ' + POLL_TIMEOUT_MS + 'ms timeout',
        'TIMEOUT',
      );
    }
    await sleep(POLL_INTERVAL_MS);
    prediction = await client.predictions.get(predictionId);
  }

  if (prediction.status === 'succeeded') {
    return prediction.output;
  }

  if (prediction.status === 'canceled') {
    throw new FluxError('Flux prediction canceled', 'GENERATION_FAILED');
  }

  // 'failed'
  throw new FluxError(
    'Flux prediction failed: ' + (prediction.error || 'unknown error'),
    'GENERATION_FAILED',
  );
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function extractUrls(output: unknown): string[] {
  const urls: string[] = [];
  if (typeof output === 'string') {
    urls.push(output);
  } else if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === 'string') urls.push(item);
      else if (item && typeof (item as any).url === 'function') {
        // FileOutput in newer SDK: not awaited here because we need sync extraction
        // We fall back to the url field if available
        const u = (item as any).url;
        if (typeof u === 'string') urls.push(u);
      } else if (item && (item as any).url) {
        urls.push(String((item as any).url));
      }
    }
  } else if (output && typeof (output as any).url === 'string') {
    urls.push((output as any).url);
  }
  return urls.filter(
    (u): u is string => typeof u === 'string' && u.startsWith('http'),
  );
}

function computeBackoff(attempt: number): number {
  const exp = BASE_BACKOFF_MS * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 1000);
  return Math.min(exp + jitter, MAX_BACKOFF_MS);
}

function toFluxError(err: unknown): FluxError {
  if (err instanceof FluxError) return err;

  const anyErr = err as any;
  const message = anyErr?.message || String(err);
  const status =
    anyErr?.response?.status ||
    anyErr?.status ||
    (typeof anyErr?.statusCode === 'number' ? anyErr.statusCode : undefined);

  const msgLower = message.toLowerCase();
  const is429 =
    status === 429 ||
    msgLower.includes('429') ||
    msgLower.includes('rate limit') ||
    msgLower.includes('too many');

  if (is429) return new FluxError(message, 'RATE_LIMITED', status);
  if (msgLower.includes('timeout') || msgLower.includes('timed out')) {
    return new FluxError(message, 'TIMEOUT', status);
  }

  return new FluxError(message, 'UNKNOWN', status);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════
// Optional helper preserved from older client
// ═══════════════════════════════════════════════════════════

export function enhancePrompt(
  prompt: string,
  preset?: 'editorial' | 'startup' | 'luxury',
): string {
  if (!preset) return prompt;
  const suffix = {
    editorial:
      ' editorial photography, magazine-grade composition, cinematic color grading',
    startup: ' modern product photography, clean lighting, startup aesthetic',
    luxury: ' luxury product photography, premium lighting, refined palette',
  }[preset];
  return prompt + suffix;
}
