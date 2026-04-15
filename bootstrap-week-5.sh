#!/usr/bin/env bash
set -euo pipefail

echo ">>> Operator AI - Week 5"
echo ">>> Gemini 3.1 Pro + Image Studio"
echo ""

cd "$(dirname "$0")"

if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

echo ">>> Installing deps (Google Generative AI + Replicate)..."
pnpm add @google/generative-ai replicate 2>&1 | tail -5

echo ""
echo ">>> Creating directories..."
mkdir -p src/features/image-studio/components
mkdir -p src/features/image-studio/server
mkdir -p src/features/image-studio/hooks
mkdir -p src/features/image-studio/data
mkdir -p src/app/api/images/generate
mkdir -p src/app/api/images/list
mkdir -p src/app/api/images/star
mkdir -p src/app/api/images/delete
mkdir -p "src/app/(app)/studio/image"

echo ">>> Adding GOOGLE_API_KEY to env schema..."

cat > src/lib/env.ts << 'EOFENV'
import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().url().optional());

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Operator AI'),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),

  DEFAULT_TEXT_PROVIDER: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  DEFAULT_IMAGE_PROVIDER: z.enum(['replicate']).default('replicate'),

  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: optionalUrl.transform((v) => v ?? 'https://cloud.langfuse.com'),

  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Operator AI <noreply@operatorai.app>'),
});

export const serverEnv = (() => {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv accessed in browser');
  }
  return serverSchema.parse(process.env);
})();
EOFENV
echo "OK env.ts"

echo ">>> Adding Gemini provider..."

cat > src/lib/providers/google.ts << 'EOFGOOGLE'
import { GoogleGenerativeAI } from '@google/generative-ai';
import { serverEnv } from '@/lib/env';
import type { ChatProvider, ProviderRequest, StreamDelta } from './types';
import { costForUsage } from './types';

export class GoogleProvider implements ChatProvider {
  readonly name = 'google' as const;
  private client: GoogleGenerativeAI;

  constructor() {
    if (!serverEnv.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not set');
    }
    this.client = new GoogleGenerativeAI(serverEnv.GOOGLE_API_KEY);
  }

  async *stream(req: ProviderRequest, signal?: AbortSignal): AsyncIterable<StreamDelta> {
    try {
      const model = this.client.getGenerativeModel({
        model: req.model,
        systemInstruction: req.system,
      });

      // Convert to Gemini format
      const history = req.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' as const : 'user' as const,
          parts: [{ text: m.content }],
        }));

      const lastMessage = req.messages[req.messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        yield { type: 'error', message: 'Last message must be from user' };
        return;
      }

      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: req.temperature ?? 0.7,
          maxOutputTokens: req.maxTokens ?? 8192,
        },
      });

      const result = await chat.sendMessageStream(lastMessage.content);

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of result.stream) {
        if (signal?.aborted) break;
        const text = chunk.text();
        if (text) yield { type: 'text', value: text };
      }

      const response = await result.response;
      const usage = response.usageMetadata;
      if (usage) {
        inputTokens = usage.promptTokenCount ?? 0;
        outputTokens = usage.candidatesTokenCount ?? 0;
      }

      yield {
        type: 'done',
        inputTokens,
        outputTokens,
        costUsd: costForUsage(req.model, inputTokens, outputTokens),
      };
    } catch (err) {
      yield { type: 'error', message: err instanceof Error ? err.message : 'Google error' };
    }
  }
}
EOFGOOGLE
echo "OK google.ts"

echo ">>> Updating provider types with Google..."

cat > src/lib/providers/types.ts << 'EOFTYPES'
export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ProviderRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  system?: string;
}

export type StreamDelta =
  | { type: 'text'; value: string }
  | { type: 'done'; inputTokens?: number; outputTokens?: number; costUsd?: number }
  | { type: 'error'; message: string };

export interface ChatProvider {
  readonly name: 'openai' | 'anthropic' | 'google';
  stream(req: ProviderRequest, signal?: AbortSignal): AsyncIterable<StreamDelta>;
}

// Pricing in USD per 1M tokens (April 2026).
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
  'claude-opus-4-5-20251101': { input: 15, output: 75 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'gemini-3.1-pro-preview': { input: 1.25, output: 10 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
};

export function costForUsage(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
EOFTYPES
echo "OK types.ts"

echo ">>> Updating provider registry with Google..."

cat > src/lib/providers/index.ts << 'EOFIDX'
import type { ChatProvider } from './types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { serverEnv } from '@/lib/env';

let openai: OpenAIProvider | null = null;
let anthropic: AnthropicProvider | null = null;
let google: GoogleProvider | null = null;

export type ProviderName = 'openai' | 'anthropic' | 'google';

export function getProvider(name: ProviderName): ChatProvider {
  if (name === 'openai') {
    if (!openai) openai = new OpenAIProvider();
    return openai;
  }
  if (name === 'anthropic') {
    if (!anthropic) anthropic = new AnthropicProvider();
    return anthropic;
  }
  if (!google) google = new GoogleProvider();
  return google;
}

export function getDefaultProvider(): ChatProvider {
  return getProvider(serverEnv.DEFAULT_TEXT_PROVIDER);
}

export function resolveModelForProvider(name: ProviderName): string {
  if (name === 'openai') return 'gpt-4o';
  if (name === 'anthropic') return 'claude-sonnet-4-5-20250929';
  return 'gemini-3.1-pro-preview';
}

export * from './types';
EOFIDX
echo "OK providers/index.ts"

echo ">>> Updating chat store with Gemini..."

cat > src/features/chat/stores/chat-store.ts << 'EOFSTORE'
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId =
  | 'gpt-4o'
  | 'claude-sonnet-4-5-20250929'
  | 'gemini-3.1-pro-preview';

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: 'openai' | 'anthropic' | 'google';
  hint: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', hint: 'Fast, reliable, general-purpose' },
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'anthropic', hint: 'Industry-leading reasoning and agentic work' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', provider: 'google', hint: 'Deep reasoning, 1M context, multimodal' },
];

interface ChatState {
  selectedModel: ModelId;
  setModel: (id: ModelId) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedModel: 'gpt-4o',
      setModel: (id) => set({ selectedModel: id }),
    }),
    { name: 'operator.chat' },
  ),
);
EOFSTORE
echo "OK chat-store.ts"

echo ">>> Updating /api/chat to accept google provider..."

# Replace the provider z.enum in chat route
perl -i -pe "s/z\.enum\(\['openai', 'anthropic'\]\)/z.enum(['openai', 'anthropic', 'google'])/g" src/app/api/chat/route.ts
echo "OK chat/route.ts"

echo ""
echo "============================================"
echo " Image Studio (Flux 1.1 Pro) starts here..."
echo "============================================"
echo ""

echo ">>> Writing presets and constants..."

cat > src/features/image-studio/data/presets.ts << 'EOFPRESETS'
export interface ImagePreset {
  id: string;
  label: string;
  hint: string;
  promptPrefix: string;
  promptSuffix: string;
  negativePrompt: string;
}

export const IMAGE_PRESETS: ImagePreset[] = [
  {
    id: 'editorial',
    label: 'Editorial',
    hint: 'Magazine-quality, refined, narrative',
    promptPrefix: 'Editorial magazine photograph, ',
    promptSuffix: '. Cinematic lighting, rich shadows, medium format film quality, 85mm lens, muted color grading with earthy tones, subtle vignette, thoughtful composition, AP photography aesthetic, professional studio lighting, high detail, 4K.',
    negativePrompt: 'cartoon, illustration, 3d render, low quality, amateur, stock photo, blurry, oversaturated, plastic skin, cheap',
  },
  {
    id: 'luxury',
    label: 'Luxury',
    hint: 'Polished, opulent, high-end brand',
    promptPrefix: 'Luxury brand campaign photograph, ',
    promptSuffix: '. Soft golden hour lighting, marble and brass surfaces, warm neutrals with subtle gold accents, shallow depth of field, exquisite texture detail, Hasselblad quality, polished sophistication, Vogue aesthetic, hyperreal, 8K.',
    negativePrompt: 'cheap, cluttered, low quality, cartoon, 3d render, stock photo, harsh lighting, overexposed',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    hint: 'Clean, calm, intentional',
    promptPrefix: 'Minimalist still life photograph, ',
    promptSuffix: '. Soft diffused daylight, clean white or pale sand background, generous negative space, precise geometric composition, Scandinavian sensibility, Kinfolk aesthetic, matte finishes, understated elegance, 4K.',
    negativePrompt: 'cluttered, busy, vibrant, cartoon, 3d render, oversaturated, dark',
  },
  {
    id: 'product',
    label: 'Product shot',
    hint: 'Clean product on studio backdrop',
    promptPrefix: 'Professional product photograph, ',
    promptSuffix: '. Studio lighting with soft shadows, seamless gradient backdrop, pin-sharp focus on product, subtle reflection underneath, commercial e-commerce quality, optimized for white background marketplaces, 8K.',
    negativePrompt: 'blurry, low quality, cartoon, 3d render, cluttered, cheap, harsh shadows, dust',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    hint: 'People, environments, authentic moments',
    promptPrefix: 'Lifestyle photograph, ',
    promptSuffix: '. Natural ambient lighting, authentic candid moment, warm cinematic color grade, 35mm film texture, shallow depth of field, contemporary aspirational aesthetic, Kodak Portra 400 film grain, 4K.',
    negativePrompt: 'staged, awkward pose, cartoon, 3d render, low quality, oversaturated, fake',
  },
];

export const ASPECT_RATIOS = [
  { id: '1:1',  label: 'Square',   w: 1024, h: 1024 },
  { id: '16:9', label: 'Widescreen', w: 1344, h: 768 },
  { id: '9:16', label: 'Vertical', w: 768,  h: 1344 },
  { id: '4:5',  label: 'Portrait', w: 896,  h: 1120 },
  { id: '3:2',  label: 'Landscape', w: 1216, h: 832 },
] as const;

export type AspectRatioId = typeof ASPECT_RATIOS[number]['id'];
EOFPRESETS
echo "OK presets.ts"

echo ">>> Writing Flux client (Replicate)..."

cat > src/features/image-studio/server/flux-client.ts << 'EOFFLUX'
import 'server-only';
import Replicate from 'replicate';
import { serverEnv } from '@/lib/env';

export interface GenerateInput {
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
  seed?: number;
  promptStrength?: number;
}

export interface GenerateOutput {
  urls: string[];
  seed: number;
  latencyMs: number;
}

export async function generateWithFlux(input: GenerateInput): Promise<GenerateOutput> {
  if (!serverEnv.REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN not set');

  const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });
  const seed = input.seed ?? Math.floor(Math.random() * 2147483647);
  const started = Date.now();

  const output = await client.run(
    'black-forest-labs/flux-1.1-pro',
    {
      input: {
        prompt: input.prompt,
        aspect_ratio: input.aspectRatio,
        output_format: 'png',
        output_quality: 95,
        safety_tolerance: 2,
        seed,
      },
    },
  );

  // Replicate returns a ReadableStream, a URL string, or an array. Normalize.
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

  if (urls.length === 0) throw new Error('Flux returned no images');

  return {
    urls,
    seed,
    latencyMs: Date.now() - started,
  };
}

/**
 * Enhances a short user prompt into a rich, detailed image prompt using GPT-4o-mini.
 * This is the magic step that separates "cat on a chair" from editorial imagery.
 */
export async function enhancePrompt(userPrompt: string, presetHint: string): Promise<string> {
  if (!serverEnv.OPENAI_API_KEY) return userPrompt;

  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  const system = 'You are an expert visual art director. Rewrite the user\'s brief into a rich, descriptive image prompt for a photorealistic image model (Flux). Be specific about: subject details, lighting, color palette, texture, camera angle, composition, and mood. Keep it under 80 words. No preamble, only the prompt itself. Preset vibe: ' + presetHint + '.';

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 180,
  });

  const text = res.choices[0]?.message?.content?.trim();
  return text || userPrompt;
}
EOFFLUX
echo "OK flux-client.ts"

echo ">>> Writing image generation API..."

cat > src/app/api/images/generate/route.ts << 'EOFGEN'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { generateWithFlux, enhancePrompt } from '@/features/image-studio/server/flux-client';
import { IMAGE_PRESETS } from '@/features/image-studio/data/presets';

export const runtime = 'nodejs';
export const maxDuration = 90;

const BodySchema = z.object({
  prompt: z.string().min(2).max(2000),
  preset: z.string().optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5', '3:2']).default('1:1'),
  seed: z.number().int().optional(),
  enhance: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const preset = IMAGE_PRESETS.find((p) => p.id === body.preset);

  // Enhance prompt first
  let enhanced = body.prompt;
  if (body.enhance) {
    try {
      enhanced = await enhancePrompt(body.prompt, preset?.hint ?? 'editorial');
    } catch {
      enhanced = body.prompt;
    }
  }

  // Apply preset wrapping
  const fullPrompt = preset
    ? preset.promptPrefix + enhanced + preset.promptSuffix
    : enhanced;

  // Insert pending record
  const pendingRow = {
    org_id: orgId,
    user_id: user.id,
    prompt: body.prompt,
    enhanced_prompt: enhanced,
    negative_prompt: preset?.negativePrompt ?? null,
    preset: body.preset ?? null,
    aspect_ratio: body.aspectRatio,
    seed: body.seed ?? null,
    provider: 'replicate',
    model: 'flux-1.1-pro',
    status: 'processing',
  } as never;

  const { data: created, error: insErr } = await svc
    .from('image_generations')
    .insert(pendingRow)
    .select('id')
    .single();

  if (insErr || !created) {
    return NextResponse.json({ error: insErr?.message ?? 'Failed to create record' }, { status: 500 });
  }
  const imageId = (created as { id: string }).id;

  try {
    const result = await generateWithFlux({
      prompt: fullPrompt,
      aspectRatio: body.aspectRatio,
      seed: body.seed,
    });

    // Persist image to Supabase storage for permanence
    const storagePaths: string[] = [];
    for (let i = 0; i < result.urls.length; i++) {
      const url = result.urls[i];
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buffer = Buffer.from(await res.arrayBuffer());
        const path = orgId + '/' + imageId + '-' + i + '.png';
        const { error: upErr } = await svc.storage
          .from('image-outputs')
          .upload(path, buffer, { contentType: 'image/png', cacheControl: '3600', upsert: true });
        if (!upErr) storagePaths.push(path);
      } catch {
        // continue with remote URL only
      }
    }

    // Rough cost for Flux 1.1 Pro
    const costUsd = 0.04 * result.urls.length;

    await svc
      .from('image_generations')
      .update({
        status: 'complete',
        output_urls: result.urls,
        output_storage_paths: storagePaths,
        seed: result.seed,
        latency_ms: result.latencyMs,
        cost_usd: costUsd,
      } as never)
      .eq('id', imageId);

    await svc.rpc('increment_usage', {
      p_org_id: orgId,
      p_kind: 'image_generation',
      p_quantity: 1,
      p_cost: costUsd,
    });

    return NextResponse.json({
      id: imageId,
      urls: result.urls,
      storagePaths,
      seed: result.seed,
      enhancedPrompt: enhanced,
      latencyMs: result.latencyMs,
      costUsd,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    await svc
      .from('image_generations')
      .update({ status: 'failed', error_message: message } as never)
      .eq('id', imageId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
EOFGEN
echo "OK images/generate/route.ts"

cat > src/app/api/images/list/route.ts << 'EOFLIST'
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

export async function GET() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { data } = await svc
    .from('image_generations')
    .select('id, prompt, enhanced_prompt, preset, aspect_ratio, seed, output_urls, output_storage_paths, status, is_starred, created_at, error_message, cost_usd, latency_ms')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100);

  // Generate signed URLs for storage paths (images stored in private bucket)
  type Row = {
    id: string;
    output_storage_paths: string[] | null;
    output_urls: string[] | null;
  };
  const rows = (data ?? []) as unknown as (Row & Record<string, unknown>)[];

  const enriched = await Promise.all(rows.map(async (r) => {
    let displayUrls: string[] = r.output_urls ?? [];
    if (r.output_storage_paths && r.output_storage_paths.length > 0) {
      const signed = await Promise.all(
        r.output_storage_paths.map(async (path) => {
          const { data } = await svc.storage.from('image-outputs').createSignedUrl(path, 60 * 60);
          return data?.signedUrl ?? null;
        }),
      );
      const validSigned = signed.filter((u): u is string => typeof u === 'string');
      if (validSigned.length > 0) displayUrls = validSigned;
    }
    return { ...r, display_urls: displayUrls };
  }));

  return NextResponse.json({ images: enriched });
}
EOFLIST
echo "OK images/list/route.ts"

cat > src/app/api/images/star/route.ts << 'EOFSTAR'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  id: z.string().min(1),
  starred: z.boolean(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { error } = await svc
    .from('image_generations')
    .update({ is_starred: parsed.data.starred } as never)
    .eq('id', parsed.data.id)
    .eq('org_id', orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
EOFSTAR
echo "OK images/star/route.ts"

cat > src/app/api/images/delete/route.ts << 'EOFDEL'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({ id: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { data: img } = await svc
    .from('image_generations')
    .select('id, output_storage_paths')
    .eq('id', parsed.data.id)
    .eq('org_id', orgId)
    .maybeSingle();
  if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const imgRow = img as { id: string; output_storage_paths: string[] | null };

  if (imgRow.output_storage_paths?.length) {
    await svc.storage.from('image-outputs').remove(imgRow.output_storage_paths).catch(() => {});
  }
  await svc.from('image_generations').delete().eq('id', imgRow.id).eq('org_id', orgId);

  return NextResponse.json({ ok: true });
}
EOFDEL
echo "OK images/delete/route.ts"

echo ">>> Writing Image Studio UI components..."

cat > src/features/image-studio/components/preset-picker.tsx << 'EOFPRESET_UI'
'use client';
import { cn } from '@/lib/utils';
import { IMAGE_PRESETS } from '../data/presets';

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

export function PresetPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {IMAGE_PRESETS.map((p) => {
        const selected = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(selected ? null : p.id)}
            className={cn(
              'text-left p-3 rounded-md border transition-all',
              selected
                ? 'border-gold/60 bg-gold/5'
                : 'border-border bg-surface-2 hover:border-border-strong',
            )}
          >
            <div className={cn('text-[13px] font-medium', selected ? 'text-fg' : 'text-fg-soft')}>
              {p.label}
            </div>
            <div className="text-[11px] text-fg-muted mt-0.5 leading-relaxed line-clamp-2">
              {p.hint}
            </div>
          </button>
        );
      })}
    </div>
  );
}
EOFPRESET_UI

cat > src/features/image-studio/components/aspect-picker.tsx << 'EOFASPECT'
'use client';
import { cn } from '@/lib/utils';
import { ASPECT_RATIOS, type AspectRatioId } from '../data/presets';

interface Props {
  value: AspectRatioId;
  onChange: (id: AspectRatioId) => void;
}

export function AspectPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ASPECT_RATIOS.map((r) => {
        const selected = r.id === value;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={cn(
              'h-8 px-3 rounded-md border text-[12px] transition-colors flex items-center gap-1.5',
              selected
                ? 'border-gold/60 bg-gold/10 text-gold'
                : 'border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-border-strong',
            )}
          >
            <span className="font-medium">{r.id}</span>
            <span className="text-fg-subtle">·</span>
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}
EOFASPECT

cat > src/features/image-studio/components/image-card.tsx << 'EOFCARD'
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Star, Trash2, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ImageItem {
  id: string;
  prompt: string;
  enhanced_prompt: string | null;
  preset: string | null;
  aspect_ratio: string;
  is_starred: boolean;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  display_urls: string[];
  created_at: string;
  error_message: string | null;
}

interface Props {
  img: ImageItem;
  onStar: (id: string, starred: boolean) => void;
  onDelete: (id: string) => void;
}

export function ImageCard({ img, onStar, onDelete }: Props) {
  const url = img.display_urls[0];
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(img.enhanced_prompt || img.prompt);
    setCopiedPrompt(true);
    toast.success('Prompt copied');
    setTimeout(() => setCopiedPrompt(false), 1400);
  }

  async function download() {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'operator-' + img.id + '.png';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Download failed');
    }
  }

  const [w, h] = img.aspect_ratio.split(':').map(Number);
  const aspectCss = { aspectRatio: (w / h).toString() };

  return (
    <div className="group relative rounded-lg overflow-hidden border border-border bg-surface-2">
      <div className="relative w-full" style={aspectCss}>
        {img.status === 'complete' && url && (
          <Image
            src={url}
            alt={img.prompt.slice(0, 60)}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        )}
        {(img.status === 'pending' || img.status === 'processing') && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2 shimmer">
            <div className="text-[11px] uppercase tracking-[0.16em] text-fg-muted">Generating...</div>
          </div>
        )}
        {img.status === 'failed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-danger/5 border border-danger/20">
            <div className="text-center px-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-danger mb-1">Failed</div>
              <div className="text-[11.5px] text-fg-muted line-clamp-3">
                {img.error_message ?? 'Unknown error'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onStar(img.id, !img.is_starred)}
          className={cn(
            'h-8 w-8 rounded-md border flex items-center justify-center backdrop-blur-md',
            img.is_starred
              ? 'bg-gold/20 border-gold/50 text-gold'
              : 'bg-bg/70 border-border text-fg-muted hover:text-gold',
          )}
          aria-label="Star"
        >
          <Star className={cn('h-3.5 w-3.5', img.is_starred && 'fill-current')} />
        </button>
        <button
          type="button"
          onClick={download}
          className="h-8 w-8 rounded-md border border-border bg-bg/70 text-fg-muted hover:text-fg flex items-center justify-center backdrop-blur-md"
          aria-label="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={copyPrompt}
          className="h-8 w-8 rounded-md border border-border bg-bg/70 text-fg-muted hover:text-fg flex items-center justify-center backdrop-blur-md"
          aria-label="Copy prompt"
        >
          {copiedPrompt ? <Check className="h-3.5 w-3.5 text-gold" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(img.id)}
          className="h-8 w-8 rounded-md border border-border bg-bg/70 text-fg-muted hover:text-danger flex items-center justify-center backdrop-blur-md"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Permanent star indicator (bottom-left) */}
      {img.is_starred && (
        <div className="absolute top-2 left-2 h-6 px-1.5 rounded text-[10px] uppercase tracking-[0.12em] bg-gold/20 backdrop-blur-md border border-gold/30 text-gold flex items-center gap-1">
          <Star className="h-2.5 w-2.5 fill-current" />
          Starred
        </div>
      )}

      {/* Prompt preview footer */}
      <div className="px-3 py-2 border-t border-border">
        <p className="text-[11.5px] text-fg-muted line-clamp-2 leading-snug">
          {img.prompt}
        </p>
      </div>
    </div>
  );
}
EOFCARD

cat > src/features/image-studio/components/image-studio-view.tsx << 'EOFVIEW'
'use client';
import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { PresetPicker } from './preset-picker';
import { AspectPicker } from './aspect-picker';
import { ImageCard, type ImageItem } from './image-card';
import type { AspectRatioId } from '../data/presets';

export function ImageStudioView() {
  const [prompt, setPrompt] = useState('');
  const [preset, setPreset] = useState<string | null>('editorial');
  const [aspect, setAspect] = useState<AspectRatioId>('1:1');
  const [enhance, setEnhance] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'starred'>('all');

  const refresh = useCallback(async () => {
    const res = await fetch('/api/images/list');
    const data = await res.json();
    setImages(data.images ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function generate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);

    // Optimistic placeholder
    const tempId = 'temp-' + Date.now();
    const placeholder: ImageItem = {
      id: tempId,
      prompt,
      enhanced_prompt: null,
      preset,
      aspect_ratio: aspect,
      is_starred: false,
      status: 'processing',
      display_urls: [],
      created_at: new Date().toISOString(),
      error_message: null,
    };
    setImages((prev) => [placeholder, ...prev]);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          preset: preset ?? undefined,
          aspectRatio: aspect,
          enhance,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Generation failed');

      toast.success('Image ready');
      setPrompt('');
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
      setImages((prev) => prev.filter((i) => i.id !== tempId));
    } finally {
      setGenerating(false);
    }
  }

  async function onStar(id: string, starred: boolean) {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, is_starred: starred } : i)));
    await fetch('/api/images/star', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, starred }),
    }).catch(() => {
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, is_starred: !starred } : i)));
    });
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this image?')) return;
    setImages((prev) => prev.filter((i) => i.id !== id));
    await fetch('/api/images/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  const visible = filter === 'starred' ? images.filter((i) => i.is_starred) : images;

  return (
    <div className="space-y-8">
      {/* Composer */}
      <div className="surface-raised p-6 space-y-5">
        <div>
          <Label htmlFor="prompt">What to generate</Label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A minimalist still life of a crystal perfume bottle on warm marble, soft morning light..."
            rows={3}
            className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:bg-surface-3 focus:ring-2 focus:ring-gold/15 resize-none"
          />
          <div className="mt-2 flex items-center gap-2 text-[11.5px] text-fg-subtle">
            <Wand2 className="h-3 w-3 text-gold" />
            <span>
              {enhance
                ? 'Prompt enhancer is on — your brief gets rewritten with expert detail.'
                : 'Prompt enhancer is off — your text is used raw.'}
            </span>
            <button
              type="button"
              onClick={() => setEnhance((v) => !v)}
              className="text-gold hover:underline"
            >
              {enhance ? 'Turn off' : 'Turn on'}
            </button>
          </div>
        </div>

        <div>
          <Label>Preset</Label>
          <PresetPicker value={preset} onChange={setPreset} />
        </div>

        <div>
          <Label>Aspect ratio</Label>
          <AspectPicker value={aspect} onChange={setAspect} />
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            size="md"
            onClick={generate}
            disabled={!prompt.trim() || generating}
            loading={generating}
          >
            {!generating && <Sparkles className="h-4 w-4" />}
            <span>{generating ? 'Generating...' : 'Generate'}</span>
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px]">Library</h2>
        <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-surface-2">
          {(['all', 'starred'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                'h-7 px-3 rounded text-[12px] transition-colors ' +
                (filter === f ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg')
              }
            >
              {f === 'all' ? 'All' : 'Starred'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-16 text-center">
          <Loader2 className="h-8 w-8 text-gold/40 mx-auto mb-3" />
          <p className="text-[13.5px] text-fg-muted">
            {filter === 'starred' ? 'No starred images yet.' : 'No images yet. Your first generation takes ~15 seconds.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((img) => (
            <ImageCard key={img.id} img={img} onStar={onStar} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
EOFVIEW
echo "OK image-studio-view.tsx"

echo ">>> Updating /studio/image page..."

cat > "src/app/(app)/studio/image/page.tsx" << 'EOFPAGE'
import { ImageStudioView } from '@/features/image-studio/components/image-studio-view';

export default function ImageStudioPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1200px] w-full mx-auto space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Editorial imagery</div>
        <h1 className="font-display text-[32px]">Image Studio</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[560px]">
          Flux 1.1 Pro with preset-driven visual direction. Write a brief, pick a preset, let the prompt enhancer do the rest.
        </p>
      </div>
      <ImageStudioView />
    </div>
  );
}
EOFPAGE

echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -20

echo ""
echo "========================================"
echo "  Week 5 complete."
echo "========================================"
echo ""
echo "What's new:"
echo "  * Gemini 3.1 Pro as third model in chat selector (streaming)"
echo "  * Image Studio at /studio/image"
echo "  * Flux 1.1 Pro via Replicate (~15 sec per image)"
echo "  * 5 editorial presets: Editorial, Luxury, Minimal, Product, Lifestyle"
echo "  * Prompt enhancer (GPT-4o-mini rewrites briefs)"
echo "  * Library grid with starring, download, delete, copy-prompt"
echo "  * Images persisted to Supabase Storage with signed URLs"
echo ""
echo "Restart pnpm dev if running."
echo ""
echo "Test:"
echo "  1. http://localhost:3000/chat — select Gemini 3.1 Pro from dropdown"
echo "  2. http://localhost:3000/studio/image — write a brief and generate"
echo ""
