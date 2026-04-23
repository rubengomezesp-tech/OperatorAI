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

export async function generateWithFlux(
  input: GenerateInput,
): Promise<GenerateOutput> {
  if (!serverEnv.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not set');
  }

  const client = new Replicate({
    auth: serverEnv.REPLICATE_API_TOKEN,
  });

  const seed = input.seed ?? Math.floor(Math.random() * 999999999);
  const started = Date.now();

  const size =
    ASPECT_TO_SIZE[input.aspectRatio] ?? ASPECT_TO_SIZE['1:1'];

  // ✅ PAYLOAD CORRECTO PARA FLUX
  const payload: any = {
    prompt: String(input.prompt || ''),
    width: size.w,
    height: size.h,
    num_images: 1, // 🔥 CLAVE (NO num_outputs)
    seed,
  };

  // Validación básica (evita llamadas basura)
  if (!payload.prompt || payload.prompt.length < 10) {
    throw new Error('Invalid prompt sent to Flux');
  }

  // Negative prompt opcional
  if (input.negativePrompt && typeof input.negativePrompt === 'string') {
    payload.negative_prompt = input.negativePrompt;
  }

  console.log('[flux-client] payload:', payload);

  const model = 'black-forest-labs/flux-1.1-pro';

  try {
    const output = await client.run(model, {
  input: payload,
});

let urls: string[] = [];

if (typeof output === 'string') {
  urls = [output];
} else if (Array.isArray(output)) {
  for (const item of output) {
    if (typeof item === 'string') {
      urls.push(item);
    } else if (item && typeof item === 'object') {
      const maybeUrl = (item as any).url;

      if (typeof maybeUrl === 'string') {
        urls.push(maybeUrl);
      } else if (typeof maybeUrl === 'function') {
        urls.push(await maybeUrl());
      } else if (typeof (item as any).toString === 'function') {
        const asString = String(item);
        if (asString.startsWith('http')) {
          urls.push(asString);
        }
      }
    }
  }
} else if (output && typeof output === 'object') {
  const maybeUrl = (output as any).url;

  if (typeof maybeUrl === 'string') {
    urls = [maybeUrl];
  } else if (typeof maybeUrl === 'function') {
    urls = [await maybeUrl()];
  }
}

urls = urls.filter((u): u is string => typeof u === 'string' && u.startsWith('http'));

if (!urls.length) {
  console.error('[flux-client] RAW OUTPUT:', output);
  throw new Error('No image returned from Flux');
}

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

// ✅ Esto lo necesitas para que no rompa el build
export function enhancePrompt(
  prompt: string,
  preset?: 'editorial' | 'startup' | 'luxury',
): string {
  if (!preset) return prompt;

  const suffix = {
    editorial:
      ' editorial photography, cinematic lighting, magazine style',
    startup:
      ' modern product shot, clean lighting, startup aesthetic',
    luxury:
      ' luxury photography, premium lighting, high-end composition',
  }[preset];

  return prompt + suffix;
}
