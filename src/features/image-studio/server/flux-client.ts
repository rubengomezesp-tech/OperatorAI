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
  buffers?: Buffer[];
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

async function toBufferFromUnknownBinary(value: unknown): Promise<Buffer | null> {
  if (!value) return null;

  try {
    // Web ReadableStream / stream-like objects
    const res = new Response(value as BodyInit);
    const ab = await res.arrayBuffer();
    if (ab.byteLength > 0) return Buffer.from(ab);
  } catch {
    // continue
  }

  try {
    // Blob-like
    if (
      typeof value === 'object' &&
      value !== null &&
      'arrayBuffer' in (value as any) &&
      typeof (value as any).arrayBuffer === 'function'
    ) {
      const ab = await (value as any).arrayBuffer();
      if (ab?.byteLength > 0) return Buffer.from(ab);
    }
  } catch {
    // continue
  }

  return null;
}

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
  const size = ASPECT_TO_SIZE[input.aspectRatio] ?? ASPECT_TO_SIZE['1:1'];

  const payload: Record<string, unknown> = {
    prompt: String(input.prompt || ''),
    width: size.w,
    height: size.h,
    num_images: 1,
    seed,
  };

  if (typeof payload.prompt !== 'string' || payload.prompt.length < 10) {
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

  const model = 'black-forest-labs/flux-1.1-pro';

  try {
    const output = await client.run(model, { input: payload });

    const urls: string[] = [];
    const buffers: Buffer[] = [];

    if (typeof output === 'string') {
      urls.push(output);
    } else if (Array.isArray(output)) {
      for (const item of output) {
        if (typeof item === 'string') {
          urls.push(item);
          continue;
        }

        if (item && typeof item === 'object') {
          const maybeUrl = (item as any).url;

          if (typeof maybeUrl === 'string') {
            urls.push(maybeUrl);
            continue;
          }

          if (typeof maybeUrl === 'function') {
            const resolved = await maybeUrl();
            if (typeof resolved === 'string') urls.push(resolved);
            continue;
          }
        }

        const buf = await toBufferFromUnknownBinary(item);
        if (buf) buffers.push(buf);
      }
    } else if (output && typeof output === 'object') {
      const maybeUrl = (output as any).url;

      if (typeof maybeUrl === 'string') {
        urls.push(maybeUrl);
      } else if (typeof maybeUrl === 'function') {
        const resolved = await maybeUrl();
        if (typeof resolved === 'string') urls.push(resolved);
      } else {
        const buf = await toBufferFromUnknownBinary(output);
        if (buf) buffers.push(buf);
      }
    }

    const cleanUrls = urls.filter(
      (u): u is string => typeof u === 'string' && u.startsWith('http'),
    );

    if (cleanUrls.length > 0) {
      return {
        urls: cleanUrls,
        buffers,
        seed,
        latencyMs: Date.now() - started,
      };
    }

    if (buffers.length > 0) {
      const dataUrl = `data:image/png;base64,${buffers[0].toString('base64')}`;
      return {
        urls: [dataUrl],
        buffers,
        seed,
        latencyMs: Date.now() - started,
      };
    }

    console.error('[flux-client] RAW OUTPUT:', output);
    throw new Error('No image returned from Flux');
  } catch (err) {
    console.error('[flux-client] ERROR:', err);
    throw err;
  }
}

export function enhancePrompt(
  prompt: string,
  preset?: 'editorial' | 'startup' | 'luxury',
): string {
  if (!preset) return prompt;

  const suffix = {
    editorial: ' editorial photography, cinematic lighting, magazine style',
    startup: ' modern product shot, clean lighting, startup aesthetic',
    luxury: ' luxury photography, premium lighting, high-end composition',
  }[preset];

  return prompt + suffix;
}
