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

// 🔥 MODELOS TIPADOS (esto evita el error de TS)
const MODEL_MAP = {
  'flux-2-pro': 'black-forest-labs/flux-1.1-pro',
  'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
} as const;

const MAX_RETRIES = 3;

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
  const client = new Replicate({
    auth: serverEnv.REPLICATE_API_TOKEN,
    useFileOutput: false,
  });

  const seed = input.seed ?? Math.floor(Math.random() * 999999999);
  const started = Date.now();
  const size = ASPECT_TO_SIZE[input.aspectRatio] ?? ASPECT_TO_SIZE['1:1'];

  const payload: Record<string, unknown> = {
    prompt: String(input.prompt || ''),
    width: size.w,
    height: size.h,
    num_images: 1,
    seed,
  };

  if (typeof payload.prompt !== 'string' || payload.prompt.trim().length < 10) {
    throw new Error('Invalid prompt sent to Flux');
  }

  if (
    input.negativePrompt &&
    typeof input.negativePrompt === 'string' &&
    input.negativePrompt.trim().length > 0
  ) {
    payload.negative_prompt = input.negativePrompt.trim();
  }

  const modelKey = input.model || 'flux-1.1-pro';
  const model = MODEL_MAP[modelKey];

  console.log('[flux-client] payload:', payload);

  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const output = await client.run(
        model as unknown as `${string}/${string}`,
        { input: payload },
      );

      let urls: string[] = [];

      if (typeof output === 'string') {
        urls = [output];
      } else if (Array.isArray(output)) {
        urls = output.filter((u): u is string => typeof u === 'string');
      } else if (output && typeof output === 'object') {
        const maybeUrl = (output as any).url;
        if (typeof maybeUrl === 'string') {
          urls = [maybeUrl];
        }
      }

      const cleanUrls = urls.filter(
        (u): u is string => typeof u === 'string' && u.startsWith('http'),
      );

      if (!cleanUrls.length) {
        console.error('[flux-client] RAW OUTPUT:', output);
        throw new Error('No image returned from Flux');
      }

      return {
        urls: cleanUrls,
        seed,
        latencyMs: Date.now() - started,
      };
    } catch (err: any) {
      const status = err?.response?.status;

      // 🔥 RATE LIMIT FIX
      if (status === 429) {
        const retryAfter =
          Number(err?.response?.headers?.get?.('retry-after')) || 10;

        console.warn(`[flux-client] 429 — retrying in ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        attempt++;
        continue;
      }

      console.error('[flux-client] ERROR:', err);
      throw err;
    }
  }

  throw new Error('Flux failed after retries');
}
