import 'server-only';
import Replicate from 'replicate';
import { serverEnv } from '@/lib/env';

export interface GenerateInput {
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
  seed?: number;
  referenceImageUrls?: string[];
  model?: 'flux-2-pro' | 'flux-1.1-pro';
  // NEW in Tanda 4A: real negative prompt passed to Replicate
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

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 12000; // 12s between retries (Replicate rate limit is 6/min)

const MODEL_TO_VERSION: Record<string, `${string}/${string}`> = {
  'flux-2-pro': 'black-forest-labs/flux-1.1-pro',
  'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateWithFlux(
  input: GenerateInput,
): Promise<GenerateOutput> {
  if (!serverEnv.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not set');
  }

  const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });
  const seed = input.seed ?? Math.floor(Math.random() * 2147483647);
  const started = Date.now();
  const size = ASPECT_TO_SIZE[input.aspectRatio] ?? ASPECT_TO_SIZE['1:1'];
  const hasReferences =
    !!input.referenceImageUrls && input.referenceImageUrls.length > 0;

  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    width: size.w,
    height: size.h,
    output_format: 'png',
    seed,
  };

  if (hasReferences) {
    payload.input_images = input.referenceImageUrls!.slice(0, 8);
  }

  // NEW in Tanda 4A: real negative_prompt
  if (input.negativePrompt && input.negativePrompt.trim().length > 0) {
    payload.negative_prompt = input.negativePrompt.trim();
  }

  const modelKey = input.model || 'flux-2-pro';
  const versionedModel = MODEL_TO_VERSION[modelKey] || MODEL_TO_VERSION['flux-2-pro'];

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const output = await client.run(versionedModel, { input: payload });

      const urls: string[] = [];
      if (typeof output === 'string') urls.push(output);
      else if (Array.isArray(output)) {
        for (const item of output) {
          if (typeof item === 'string') urls.push(item);
          else if (item && typeof (item as any).url === 'function') {
            urls.push(await (item as any).url());
          } else if (item && (item as any).url) {
            urls.push(String((item as any).url));
          }
        }
      } else if (output && typeof (output as any).url === 'function') {
        urls.push(await (output as any).url());
      } else if (output && (output as any).url) {
        urls.push(String((output as any).url));
      }

      if (urls.length === 0) {
        throw new Error('Flux returned no URL');
      }

      return {
        urls,
        seed,
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();

      // Rate limit: wait and retry
      if (
        msg.includes('rate') ||
        msg.includes('429') ||
        msg.includes('too many')
      ) {
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
      }

      // Other errors: throw immediately
      throw lastError;
    }
  }

  throw lastError || new Error('Flux generation failed');
}

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
