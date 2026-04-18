import 'server-only';
import Replicate from 'replicate';
import { serverEnv } from '@/lib/env';

export interface GenerateInput {
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
  seed?: number;
  referenceImageUrls?: string[];
}

export interface GenerateOutput {
  urls: string[];
  seed: number;
  latencyMs: number;
}

const ASPECT_TO_SIZE: Record<string, { w: number; h: number }> = {
  '1:1':  { w: 1024, h: 1024 },
  '16:9': { w: 1344, h: 768 },
  '9:16': { w: 768,  h: 1344 },
  '4:5':  { w: 896,  h: 1120 },
  '3:2':  { w: 1216, h: 832 },
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 12000; // 12 seconds between retries (Replicate rate limit is 6/min)

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateWithFlux(input: GenerateInput): Promise<GenerateOutput> {
  if (!serverEnv.REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN not set');

  const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });
  const seed = input.seed ?? Math.floor(Math.random() * 2147483647);
  const started = Date.now();
  const size = ASPECT_TO_SIZE[input.aspectRatio] ?? ASPECT_TO_SIZE['1:1'];

  const hasReferences = input.referenceImageUrls && input.referenceImageUrls.length > 0;

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

  // Retry loop for rate limits
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const output = await client.run(
        'black-forest-labs/flux-2-pro',
        { input: payload },
      );

      const urls = normalizeReplicateOutput(output);
      if (urls.length === 0) throw new Error('Flux returned no images');

      return {
        urls,
        seed,
        latencyMs: Date.now() - started,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const msg = lastError.message.toLowerCase();

      // If rate limited (429), wait and retry
      if (msg.includes('429') || msg.includes('throttled') || msg.includes('rate limit')) {
        console.log(`[flux] Rate limited, waiting ${RETRY_DELAY_MS / 1000}s before retry ${attempt + 1}/${MAX_RETRIES}...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      // If server error (5xx), retry once
      if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
        console.log(`[flux] Server error, retrying in 3s...`);
        await sleep(3000);
        continue;
      }

      // For other errors, don't retry
      throw lastError;
    }
  }

  throw lastError ?? new Error('Max retries reached');
}

function normalizeReplicateOutput(output: unknown): string[] {
  const urls: string[] = [];
  if (typeof output === 'string') {
    urls.push(output);
  } else if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === 'string') urls.push(item);
      else if (item && typeof item === 'object' && 'url' in item) {
        const maybeUrl = (item as { url: unknown }).url;
        if (typeof maybeUrl === 'function') {
          const resolved = (maybeUrl as () => URL | string)();
          urls.push(typeof resolved === 'string' ? resolved : resolved.toString());
        } else if (typeof maybeUrl === 'string') {
          urls.push(maybeUrl);
        }
      }
    }
  } else if (output && typeof output === 'object') {
    const maybeUrl = (output as { url?: unknown }).url;
    if (typeof maybeUrl === 'function') {
      const resolved = (maybeUrl as () => URL | string)();
      urls.push(typeof resolved === 'string' ? resolved : resolved.toString());
    } else if (typeof maybeUrl === 'string') {
      urls.push(maybeUrl);
    }
  }
  return urls;
}

/**
 * Rewrites user brief into a rich image prompt.
 */
export async function enhancePrompt(
  userPrompt: string,
  presetHint: string,
  hasReferences: boolean,
): Promise<string> {
  if (!serverEnv.OPENAI_API_KEY) return userPrompt;

  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  const refHint = hasReferences
    ? ' The user has attached reference images - their style, subject, lighting, or composition should guide the output.'
    : '';

  const system =
    'You are an expert visual art director. Rewrite the user\'s brief into a rich, descriptive image prompt for Flux 2 Pro. Be specific about subject details, lighting, color palette, texture, camera angle, composition, and mood. Keep it under 100 words. No preamble, only the prompt itself. Preset vibe: ' +
    presetHint + '.' + refHint;

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  const text = res.choices[0]?.message?.content?.trim();
  return text || userPrompt;
}
