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
      'Generate a premium on-brand image from a text prompt. Use when the user asks for an image, visual, product shot, photo, illustration, or picture. Returns image URLs shown inline. Takes ~6 seconds.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed description: subject, style, lighting, mood.' },
        preset: { type: 'string', enum: ['editorial', 'product', 'lifestyle', 'abstract', 'minimal'], description: 'Visual preset. Default editorial.' },
        aspect_ratio: { type: 'string', enum: ['1:1', '16:9', '9:16', '4:5', '3:2'], description: 'Aspect ratio. Default 1:1.' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'video',
    description:
      'Generate a short cinematic video (~4s) from a prompt. Use when user asks for video, clip, animation. Takes ~60-90s. Returns video URL inline.',
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
      'Analyze a spreadsheet/CSV/JSON the user uploaded. Use when the user asks about their data. Ask which file if not specified.',
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
      'Search the user Knowledge base (PDFs, brand docs). Use when user asks about their own materials.',
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

async function internalFetch(
  ctx: ToolContext,
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; data: Record<string, unknown>; status: number }> {
  const res = await fetch(ctx.origin + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: ctx.cookieHeader,
    },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, data, status: res.status };
}

async function execImage(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const prompt = String(input.prompt ?? '').trim();
  if (!prompt) return { ok: false, error: 'Empty prompt' };
  const { ok, data, status } = await internalFetch(ctx, '/api/images/generate', {
    prompt,
    preset: (input.preset as string) ?? 'editorial',
    aspectRatio: (input.aspect_ratio as string) ?? '1:1',
    enhance: true,
  });
  if (!ok) return { ok: false, error: String(data.error ?? 'Image generation failed (' + status + ')') };
  const urls = Array.isArray(data.urls) ? (data.urls as string[]) : [];
  if (urls.length === 0) return { ok: false, error: 'No image returned' };
  return { ok: true, result: { urls } };
}

async function execVideo(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const prompt = String(input.prompt ?? '').trim();
  if (!prompt) return { ok: false, error: 'Empty prompt' };
  const { ok, data, status } = await internalFetch(ctx, '/api/video/generate', {
    prompt,
    duration: Number(input.duration ?? 4),
  });
  if (!ok) return { ok: false, error: String(data.error ?? 'Video failed (' + status + ')') };
  const videoUrl = (data.videoUrl as string) ?? (data.url as string) ?? ((data.video as { url?: string })?.url);
  if (!videoUrl) return { ok: false, error: 'No video URL returned' };
  return { ok: true, result: { videoUrl, thumbnailUrl: (data.thumbnailUrl as string) ?? (data.thumbnail_url as string) } };
}

async function execFileAnalysis(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const fileId = String(input.file_id ?? '');
  const question = String(input.question ?? '');
  if (!fileId || !question) return { ok: false, error: 'Missing file_id or question' };
  const { ok, data, status } = await internalFetch(ctx, '/api/files/analyze', { fileId, question });
  if (!ok) return { ok: false, error: String(data.error ?? 'Analysis failed (' + status + ')') };
  return { ok: true, result: { text: String(data.answer ?? '') } };
}

async function execKnowledgeSearch(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const query = String(input.query ?? '').trim();
  if (!query) return { ok: false, error: 'Empty query' };
  const { embedOne } = await import('@/lib/rag/embeddings');
  const { retrieveChunks, formatKnowledgeBlock } = await import('@/lib/rag/retrieve');
  const queryEmbedding = await embedOne(query);
  const chunks = await retrieveChunks({ svc: ctx.svc, orgId: ctx.orgId, assistantId: ctx.assistantId, query, queryEmbedding, topK: 6 });
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
