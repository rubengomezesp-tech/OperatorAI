import 'server-only';
import Replicate from 'replicate';
import { serverEnv } from '@/lib/env';

export interface GenerateInput {
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
  seed?: number;
  referenceImageUrls?: string[];
  model?: 'flux-2-pro' | 'flux-1.1-pro';
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
      const modelId = input.model === 'flux-1.1-pro' ? 'black-forest-labs/flux-1.1-pro' : 'black-forest-labs/flux-2-pro';
      const output = await client.run(
        modelId,
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
  brandContext?: { name?: string; description?: string; vibe?: string; colors?: string[]; visualStyle?: string; audience?: string; avoid?: string[] },
): Promise<string> {
  if (!serverEnv.OPENAI_API_KEY) return userPrompt;

  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  const refHint = hasReferences
    ? ' The user has attached reference images - their style, subject, lighting, or composition should guide the output.'
    : '';

  let brandHint = '';
  if (brandContext) {
    const parts: string[] = [];
    if (brandContext.name) parts.push('Brand: ' + brandContext.name);
    if (brandContext.vibe) parts.push('Vibe: ' + brandContext.vibe);
    if (brandContext.colors && brandContext.colors.length > 0) parts.push('Brand colors: ' + brandContext.colors.join(', '));
    if (brandContext.visualStyle) parts.push('Visual style: ' + brandContext.visualStyle);
    if (brandContext.audience) parts.push('Target audience: ' + brandContext.audience);
    if (brandContext.avoid && brandContext.avoid.length > 0) parts.push('AVOID: ' + brandContext.avoid.join(', '));
    if (parts.length > 0) brandHint = ' Brand context: ' + parts.join('. ') + '.';
  }

  const system =
    'You are a world-class commercial photographer and art director. Transform the brief into an extremely precise photorealistic prompt for Flux 2 Pro. Specify: 1) exact subject with details, 2) camera lens and aperture, 3) lighting setup, 4) specific color palette, 5) composition technique, 6) texture and materials, 7) mood. Must look like a real photograph. Under 100 words. Output ONLY the prompt. Preset vibe: ' +
    presetHint + '.' + refHint + brandHint;

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
