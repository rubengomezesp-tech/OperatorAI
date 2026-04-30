import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export type ToolKind = 'image' | 'video' | 'file_analysis' | 'knowledge_search' | 'get_brand_assets' | 'compose_ad';

export interface ToolSpec {
  name: ToolKind;
  description: string;
  input_schema: Record<string, unknown>;
}

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'image',
    description:
      'Generate or EDIT premium photorealistic images. Use for: creating images, editing existing images, applying changes to images, generating variations with reference. CAPABILITIES: (1) Create new images from text. (2) EDIT/MODIFY existing images — when the user uploads an image OR references a previous image in chat, pass its URL via reference_image_url and describe the edit in the prompt. (3) Use brand assets/logos as references. YOU write the full detailed prompt (40-80 words) with: subject, camera, lighting, colors, composition, mood. For logos: style, typography, symbol, colors. NEVER add random text. NEVER refuse to generate. ALWAYS produce output. For variations set num_images 2-4. CRITICAL: If the user asks to edit/modify an image they uploaded or a previous image, ALWAYS use this tool with reference_image_url — DO NOT say you cannot edit images, you absolutely can.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed description. For new image: subject, composition, lighting, mood, colors, style (20+ words). For edits: describe the changes to apply (e.g., "change background to navy blue with dramatic lighting").' },
        aspect_ratio: { type: 'string', enum: ['1:1', '16:9', '9:16', '4:5', '3:2'], description: 'Aspect ratio. Default 1:1.' },
        num_images: { type: 'number', enum: [1, 2, 3, 4], description: 'Number of variations. Default 1. Use 2-4 for options.' },
        reference_image_url: { type: 'string', description: 'Optional URL of an image to use as reference/base for editing. Pass when user wants to modify an existing image, apply changes to a previous image, or use a logo/brand asset as starting point.' },
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
  {
    name: 'get_brand_assets',
    description:
      'Retrieve the user current brand context (name, colors, fonts, logo URL, voice, target audience). Use this BEFORE generating any creative output if user says "use my brand", "respect my brand", "with my colors/logo", or whenever brand consistency matters. Call without parameters — the user is inferred from session.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'compose_ad',
    description:
      'Compose a final advertising image by combining a generated/existing background image with copy, logo and brand colors. Use when user wants a "ready-to-publish ad" or "ad with my logo" instead of just an image. Returns a composed image URL.',
    input_schema: {
      type: 'object',
      properties: {
        background_url: { type: 'string', description: 'URL of the background image (use a previously generated image or stock).' },
        headline: { type: 'string', description: 'Main headline text (1-8 words). Should be punchy and conversion-focused.' },
        subline: { type: 'string', description: 'Optional supporting line (5-15 words).' },
        cta: { type: 'string', description: 'Call to action text (e.g. "Shop now", "Get yours").' },
        format: { type: 'string', enum: ['square', 'instagram_story', 'tiktok_in_feed', 'reel'], description: 'Output format. Default square.' },
        use_brand: { type: 'boolean', description: 'If true, applies user brand colors, fonts and logo automatically. Default true.' },
      },
      required: ['background_url', 'headline'],
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
      case 'get_brand_assets': return await execGetBrandAssets(input, ctx);
      case 'compose_ad': return await execComposeAd(input, ctx);
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
  const referenceUrl = typeof input.reference_image_url === 'string' && input.reference_image_url.trim().length > 0
    ? input.reference_image_url.trim()
    : null;

  // ═══ EDIT MODE: reference image present → use gpt-image-1 via /api/images/generate ═══
  if (referenceUrl) {
    try {
      const aspectGpt: '1:1' | '9:16' | '4:5' = 
        aspectRatio === '9:16' || aspectRatio === '4:5' ? aspectRatio : '1:1';
      
      const res = await fetch(`${ctx.origin}/api/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ctx.cookieHeader ? { cookie: ctx.cookieHeader } : {}),
        },
        body: JSON.stringify({
          prompt,
          aspectRatio: aspectGpt,
          model: 'gpt-image-1',
          enhance: false,
          referenceUrls: [referenceUrl],
        }),
        signal: ctx.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'unknown');
        console.error('[tools.image] edit failed:', res.status, errText);
        return { ok: false, error: `Image edit failed (${res.status})` };
      }

      const data = await res.json() as { url?: string; urls?: string[] };
      const urls = data.urls || (data.url ? [data.url] : []);
      if (urls.length === 0) return { ok: false, error: 'No image returned from edit' };
      return { ok: true, result: { urls } };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Edit failed';
      console.error('[tools.image] edit exception:', errMsg);
      return { ok: false, error: errMsg };
    }
  }

  // ═══ CREATE MODE: no reference → Flux directo (rápido) ═══
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

  // Save to DB + storage — return permanent Supabase URLs
  const permanentUrls: string[] = [];
  try {
    const imageId = crypto.randomUUID();
    const storagePaths: string[] = [];

    for (let i = 0; i < result.urls.length; i++) {
      try {
        const imgRes = await fetch(result.urls[i]);
        if (!imgRes.ok) continue;
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const path = ctx.orgId + '/' + imageId + '-' + i + '.png';
        const { error: upErr } = await ctx.svc.storage
          .from('image-outputs')
          .upload(path, buffer, { contentType: 'image/png', cacheControl: '31536000', upsert: true });
        if (!upErr) {
          storagePaths.push(path);
          const { data: pubUrl } = ctx.svc.storage.from('image-outputs').getPublicUrl(path);
          if (pubUrl?.publicUrl) permanentUrls.push(pubUrl.publicUrl);
        }
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

  return { ok: true, result: { urls: permanentUrls.length > 0 ? permanentUrls : result.urls } };
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

// ── BRAND ASSETS ──────────────────────────────────────────────────
async function execGetBrandAssets(_input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const { data: brand } = await ctx.svc
    .from('brand_profile')
    .select('brand_name, industry, colors, fonts, logo_url, primary_color, target_audience, tone_keywords, visual_style, brand_values')
    .eq('org_id', ctx.orgId)
    .maybeSingle();

  if (!brand) {
    return { ok: true, result: { text: 'No brand configured yet. User can set it up in /brand-os.' } };
  }

  const b = brand as Record<string, unknown>;
  const summary = [
    b.brand_name ? `Brand: ${b.brand_name}` : '',
    b.industry ? `Industry: ${b.industry}` : '',
    b.target_audience ? `Audience: ${b.target_audience}` : '',
    b.visual_style ? `Visual style: ${b.visual_style}` : '',
    b.primary_color ? `Primary color: ${b.primary_color}` : '',
    b.colors ? `Colors: ${JSON.stringify(b.colors)}` : '',
    b.fonts ? `Fonts: ${JSON.stringify(b.fonts)}` : '',
    b.logo_url ? `Logo URL: ${b.logo_url}` : 'No logo uploaded',
    b.tone_keywords ? `Tone: ${JSON.stringify(b.tone_keywords)}` : '',
    b.brand_values ? `Values: ${JSON.stringify(b.brand_values)}` : '',
  ].filter(Boolean).join('\n');

  return { ok: true, result: { text: summary } };
}

// ── COMPOSE AD ────────────────────────────────────────────────────
async function execComposeAd(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const backgroundUrl = String(input.background_url ?? '');
  const headline = String(input.headline ?? '');
  const subline = input.subline ? String(input.subline) : undefined;
  const cta = input.cta ? String(input.cta) : undefined;
  const format = String(input.format ?? 'square');
  const useBrand = input.use_brand !== false;

  if (!backgroundUrl || !headline) {
    return { ok: false, error: 'Missing background_url or headline' };
  }

  try {
    const res = await fetch(`${ctx.origin}/api/creative/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: ctx.cookieHeader },
      body: JSON.stringify({
        background_url: backgroundUrl,
        headline,
        subline,
        cta,
        format,
        use_brand: useBrand,
      }),
      signal: ctx.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      return { ok: false, error: `Compose failed: ${errText}` };
    }

    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    const url = String((data.url as string) || ((data.urls as string[])?.[0]) || (data.composed_url as string) || '');
    if (!url) return { ok: false, error: 'No composed URL returned' };

    return { ok: true, result: { urls: [url] } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Compose error';
    return { ok: false, error: msg };
  }
}
