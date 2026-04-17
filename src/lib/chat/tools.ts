import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export type ToolKind = 'image' | 'video' | 'file_analysis' | 'knowledge_search';

export interface ToolSpec {
  name: ToolKind;
  description: string;
  input_schema: Record<string, unknown>;
}

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'image',
    description:
      'Generate premium on-brand images from a text prompt. Use when the user asks for an image, visual, product shot, photo, illustration, or picture. Returns image URLs shown inline. Takes ~6 seconds per image. YOU write the full detailed prompt yourself — do not ask the user to refine it. When user asks for variations, options, or multiple images, set num_images to 2-4. You can vary the prompt slightly for each to give real variety.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed image description: subject, composition, lighting, mood, colors, style. Write at least 20 words. Be extremely specific and cinematic.' },
        aspect_ratio: { type: 'string', enum: ['1:1', '16:9', '9:16', '4:5', '3:2'], description: 'Aspect ratio. Default 1:1.' },
        num_images: { type: 'number', enum: [1, 2, 3, 4], description: 'Number of image variations to generate. Default 1. Use 2-4 when user asks for options, variations, or multiple.' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'video',
    description:
      'Generate a short cinematic video (~4s) from a prompt. Use when user asks for video, clip, animation. Takes ~60-90s.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Scene description with subject, camera, mood.' },
        duration: { type: 'number', enum: [4, 8], description: 'Seconds. Default 4.' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'file_analysis',
    description:
      'Analyze a spreadsheet/CSV/JSON the user uploaded. Use when the user asks about their data.',
    input_schema: {
      type: 'object',
      properties: {
        file_id: { type: 'string', description: 'ID of the uploaded file.' },
        question: { type: 'string', description: 'Question about the file.' },
      },
      required: ['file_id', 'question'],
    },
  },
  {
    name: 'knowledge_search',
    description:
      'Search the user Knowledge base (PDFs, brand docs).',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to look up.' },
      },
      required: ['query'],
    },
  },
];

export interface ToolContext {
  svc: SupabaseClient;
  orgId: string;
  userId: string;
  assistantId: string;
  origin: string;
  cookieHeader: string;
  signal?: AbortSignal;
}

export interface ToolResult {
  ok: boolean;
  result?: {
    urls?: string[];
    videoUrl?: string;
    thumbnailUrl?: string;
    text?: string;
    sources?: Array<{ title: string; id: string }>;
  };
  error?: string;
}


async function generateMultipleImages(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<{ ok: boolean; result?: { urls: string[] }; error?: string }> {
  const { generateWithFlux } = await import('@/features/image-studio/server/flux-client');
  const numImages = Math.min(Math.max(Number(input.num_images) || 1, 1), 4);
  const allUrls: string[] = [];
  
  for (let i = 0; i < numImages; i++) {
    try {
      // Vary the seed for each image to get different results
      const result = await generateWithFlux({
        prompt: String(input.prompt || ''),
        aspectRatio: (input.aspect_ratio as any) || '1:1',
        seed: Math.floor(Math.random() * 999999),
      });
      
      if (result.urls) allUrls.push(...result.urls);
    } catch (e) {
      console.error('Image generation error:', e);
    }
  }
  
  if (allUrls.length === 0) {
    return { ok: false, error: 'Failed to generate images' };
  }
  return { ok: true, result: { urls: allUrls } };
}

export async function executeTool(
  name: ToolKind,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'image': return await execImage(input, ctx);
      case 'video': return await execVideo(input, ctx);
      case 'file_analysis': return await execFileAnalysis(input, ctx);
      case 'knowledge_search': return await execKnowledgeSearch(input, ctx);
      default: return { ok: false, error: 'Unknown tool: ' + name };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Tool execution failed';
    console.error('[tools.execute]', name, msg);
    return { ok: false, error: msg };
  }
}

// ── IMAGE: calls generateWithFlux DIRECTLY, no HTTP, no enhancePrompt ──
async function execImage(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const prompt = String(input.prompt ?? '').trim();
  if (!prompt) return { ok: false, error: 'Empty prompt' };

  const aspectRatio = (input.aspect_ratio as string) ?? '1:1';

  // Import your Flux client directly
  const { generateWithFlux } = await import('@/features/image-studio/server/flux-client');

  // Call Flux directly — Claude already wrote a detailed prompt, skip enhance
  let result: { urls: string[]; seed: number; latencyMs: number };
  try {
    result = await generateWithFlux({
      prompt,
      aspectRatio: aspectRatio as '1:1' | '16:9' | '9:16' | '4:5' | '3:2',
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Flux generation failed';
    console.error('[tools.image] generateWithFlux error:', errMsg);
    return { ok: false, error: errMsg };
  }

  if (!result.urls || result.urls.length === 0) {
    return { ok: false, error: 'Flux returned no images' };
  }

  // Save to DB + storage (fire-and-forget, don't block on errors)
  try {
    const imageId = crypto.randomUUID();
    const storagePaths: string[] = [];

    for (let i = 0; i < result.urls.length; i++) {
      try {
        const res = await fetch(result.urls[i]);
        if (!res.ok) continue;
        const buffer = Buffer.from(await res.arrayBuffer());
        const path = ctx.orgId + '/' + imageId + '-' + i + '.png';
        const { error: upErr } = await ctx.svc.storage
          .from('image-outputs')
          .upload(path, buffer, { contentType: 'image/png', cacheControl: '3600', upsert: true });
        if (!upErr) storagePaths.push(path);
      } catch { /* continue */ }
    }

    const costUsd = 0.03 * result.urls.length;

    await ctx.svc.from('image_generations').insert({
      id: imageId,
      org_id: ctx.orgId,
      user_id: ctx.userId,
      prompt,
      enhanced_prompt: prompt,
      preset: 'editorial',
      aspect_ratio: aspectRatio,
      provider: 'replicate',
      model: 'flux-2-pro',
      status: 'complete',
      output_urls: result.urls,
      output_storage_paths: storagePaths,
      seed: result.seed,
      latency_ms: result.latencyMs,
      cost_usd: costUsd,
    } as never);

    await ctx.svc.rpc('increment_usage', {
      p_org_id: ctx.orgId,
      p_kind: 'image_generation',
      p_quantity: 1,
      p_cost: costUsd,
    });
  } catch (e) {
    console.error('[tools.image] DB save failed (image still returned):', e);
  }

  return { ok: true, result: { urls: result.urls } };
}

// ── VIDEO ─────────────────────────────────────────────────────────
async function execVideo(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const prompt = String(input.prompt ?? '').trim();
  if (!prompt) return { ok: false, error: 'Empty prompt' };
  const duration = Number(input.duration ?? 4);

  try {
    const mod = await import('@/features/video/server/veo-client');
    const fn = (mod as Record<string, unknown>).generateVideo ??
               (mod as Record<string, unknown>).generateWithVeo ??
               (mod as Record<string, unknown>).default;

    if (typeof fn !== 'function') {
      return { ok: false, error: 'Video function not found in veo-client' };
    }

    const raw = await (fn as Function)({
      svc: ctx.svc, orgId: ctx.orgId, userId: ctx.userId, prompt, duration,
    });

    const r = raw as Record<string, unknown> | null;
    const videoUrl = (r?.videoUrl ?? r?.url ?? r?.video_url) as string | undefined;
    const thumbnailUrl = (r?.thumbnailUrl ?? r?.thumbnail_url) as string | undefined;

    if (!videoUrl) return { ok: false, error: 'No video URL returned' };
    return { ok: true, result: { videoUrl, thumbnailUrl } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Video failed' };
  }
}

// ── FILE ANALYSIS ─────────────────────────────────────────────────
async function execFileAnalysis(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const fileId = String(input.file_id ?? '');
  const question = String(input.question ?? '');
  if (!fileId || !question) return { ok: false, error: 'Missing file_id or question' };

  const { data: fileRow } = await ctx.svc
    .from('analysis_files')
    .select('id, name')
    .eq('id', fileId)
    .eq('org_id', ctx.orgId)
    .maybeSingle();
  if (!fileRow) return { ok: false, error: 'File not found' };

  try {
    const res = await fetch(ctx.origin + '/api/files/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ctx.cookieHeader },
      body: JSON.stringify({ fileId, question }),
      signal: ctx.signal,
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: String(body.error ?? 'Analysis failed') };
    return { ok: true, result: { text: String(body.answer ?? '') } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Analysis failed' };
  }
}

// ── KNOWLEDGE SEARCH ──────────────────────────────────────────────
async function execKnowledgeSearch(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const query = String(input.query ?? '').trim();
  if (!query) return { ok: false, error: 'Empty query' };

  const { embedOne } = await import('@/lib/rag/embeddings');
  const { retrieveChunks, formatKnowledgeBlock } = await import('@/lib/rag/retrieve');

  const queryEmbedding = await embedOne(query);
  const chunks = await retrieveChunks({
    svc: ctx.svc, orgId: ctx.orgId, assistantId: ctx.assistantId,
    query, queryEmbedding, topK: 6,
  });

  if (chunks.length === 0) return { ok: true, result: { text: 'No matching documents found.' } };
  const text = formatKnowledgeBlock(chunks);
  const sources = chunks.map((c) => ({ title: c.source ?? 'Document', id: c.document_id }));
  return { ok: true, result: { text, sources } };
}

export async function buildToolFetchContext(req: Request): Promise<{ origin: string; cookieHeader: string }> {
  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? url.origin ?? 'http://localhost:3000';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => c.name + '=' + c.value).join('; ');
  return { origin, cookieHeader };
}
