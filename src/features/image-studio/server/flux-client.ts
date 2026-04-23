import 'server-only';
import Replicate from 'replicate';
import { serverEnv } from '@/lib/env';

export interface GenerateInput {
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
  seed?: number;
  model?: 'flux-2-pro' | 'flux-1.1-pro';
  negativePrompt?: string;
}

export interface GenerateOutput {
  urls: string[];
  seed: number;
  latencyMs: number;
}

const ASPECT_TO_SIZE: Record<string, { w: number; h: number }> = {
  '1:1': { w: 1024, h: 1024 },
  '16:9': { w: 1344, h: 768 },
  '9:16': { w: 768, h: 1344 },
  '4:5': { w: 896, h: 1120 },
  '3:2': { w: 1216, h: 832 },
};

const MODEL_MAP = {
  'flux-2-pro': 'black-forest-labs/flux-1.1-pro',
  'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
} as const;

const MAX_RETRIES = 3;
const DEFAULT_RETRY_AFTER_SECONDS = 10;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryAfterSeconds(err: unknown): number {
  const retryAfter =
    (err as any)?.response?.headers?.get?.('retry-after') ??
    (err as any)?.response?.headers?.['retry-after'];

  const parsed = Number(retryAfter);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_RETRY_AFTER_SECONDS;
}

async function runWithRetry(
  client: Replicate,
  model: `${string}/${string}` | `${string}/${string}:${string}`,
  payload: Record<string, unknown>,
): Promise<unknown> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      return await client.run(model, { input: payload });
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 429 && attempt < MAX_RETRIES - 1) {
        const retryAfterSeconds = extractRetryAfterSeconds(err);
        console.warn(
          `[flux-client] rate limited (429). retrying in ${retryAfterSeconds}s. attempt ${attempt + 1}/${MAX_RETRIES}`,
        );
        await sleep(retryAfterSeconds * 1000);
        attempt += 1;
        continue;
      }

      throw err;
    }
  }

  throw new Error('Flux failed after retries');
}

function normalizeOutputToUrls(output: unknown): string[] {
  if (typeof output === 'string') {
    return [output];
  }

  if (Array.isArray(output)) {
    return output.filter((u): u is string => typeof u === 'string');
  }

  if (output && typeof output === 'object') {
    const maybeUrl = (output as any).url;
    if (typeof maybeUrl === 'string') {
      return [maybeUrl];
    }
  }

  return [];
}

export async function generateWithFlux(
  input: GenerateInput,
): Promise<GenerateOutput> {
  if (!serverEnv.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not set');
  }

  const client = new Replicate({
    auth: serverEnv.REPLICATE_API_TOKEN,
    useFileOutput: false,
  });

  const seed = input.seed ?? Math.floor(Math.random() * 999_999_999);
  const started = Date.now();
  const size = ASPECT_TO_SIZE[input.aspectRatio] ?? ASPECT_TO_SIZE['1:1'];

  const payload: Record<string, unknown> = {
    prompt: String(input.prompt || ''),
    width: size.w,
    height: size.h,
    num_images: 1,
    seed,
  };

  if (
    typeof payload.prompt !== 'string' ||
    payload.prompt.trim().length < 10
  ) {
    throw new Error('Invalid prompt sent to Flux');
  }

  if (
    input.negativePrompt &&
    typeof input.negativePrompt === 'string' &&
    input.negativePrompt.trim().length > 0
  ) {
    payload.negative_prompt = input.negativePrompt.trim();
  }

  console.log('[flux-client] payload:', payload);

  const modelKey =
    input.model === 'flux-1.1-pro' || input.model === 'flux-2-pro'
      ? input.model
      : 'flux-2-pro';

  const model = MODEL_MAP[modelKey] as `${string}/${string}`;

  try {
    const output = await runWithRetry(client, model, payload);

    const urls = normalizeOutputToUrls(output).filter(
      (u): u is string => typeof u === 'string' && u.startsWith('http'),
    );

    if (!urls.length) {
      console.error('[flux-client] RAW OUTPUT:', output);
      throw new Error('No image returned from Flux');
    }

    return {
      urls,
      seed,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    console.error('[flux-client] ERROR:', err);
    throw err;
  }
}

export async function enhancePrompt(
  prompt: string,
  preset?: string,
): Promise<string> {
  if (!preset) return prompt;

  const normalized = String(preset).toLowerCase();

  const suffixMap: Record<string, string> = {
    editorial: ' editorial photography, cinematic lighting, magazine style',
    startup: ' modern product shot, clean lighting, startup aesthetic',
    luxury: ' luxury photography, premium lighting, high-end composition',
  };

  const suffix = suffixMap[normalized];
  return suffix ? prompt + suffix : prompt;
}
