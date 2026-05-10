import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { executeAdapter, type ExternalToolName } from '@/lib/orchestrator/tools';

import {
  getIntegrationToolSpecs,
  isIntegrationTool,
  executeIntegrationTool,
  type IntegrationToolSpec,
} from './integration-tools';

export type ToolKind = 'image' | 'video' | 'file_analysis' | 'knowledge_search' | 'get_brand_assets' | 'compose_ad' | 'create_ad' | 'web_search' | 'web_fetch' | 'send_email' | 'read_emails' | 'browser_action';

export interface ToolSpec {
  name: ToolKind;
  description: string;
  input_schema: Record<string, unknown>;
}

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'image',
    description:
      'Generate or EDIT raw photorealistic images, photos, illustrations or logos WITHOUT text/CTA overlay. DO NOT use this for ads, publicidad, anuncios, advertisements, or finished marketing pieces — use create_ad for those. Use this ONLY for: creating raw images, editing existing images, applying changes to images, generating variations with reference. CAPABILITIES: (1) Create new images from text. (2) EDIT/MODIFY existing images — when the user uploads an image OR references a previous image in chat, pass its URL via reference_image_url and describe the edit in the prompt. (3) Use brand assets/logos as references. YOU write the full detailed prompt (40-80 words) with: subject, camera, lighting, colors, composition, mood. For logos: style, typography, symbol, colors. NEVER add random text. NEVER refuse to generate. ALWAYS produce output. For variations set num_images 2-4. CRITICAL: If the user asks to edit/modify an image they uploaded or a previous image, ALWAYS use this tool with reference_image_url — DO NOT say you cannot edit images, you absolutely can.',
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
  {
    name: 'create_ad',
    description:
      'Create a complete advertising piece from scratch using the AD DIRECTOR pipeline. Use when user asks "create me an ad", "publicidad", "anuncio", "make an ad", or wants a finished advertisement (not just a background image). This tool runs the full 7-layer pipeline: analyzes brand context, generates the creative brief (headline, subheadline, CTA, concept), produces a premium base image, composes the final ad with text overlay and logo, and audits the result with vision QA. Returns final ad image URLs ready to publish. AUTOMATICALLY pulls the user brand logo, colors and tone from brand_profile — no need to call get_brand_assets first. Different from `image` (only generates pictures) and `compose_ad` (requires background+copy already provided). Prefer this tool whenever the user wants a finished ad.',
    input_schema: {
      type: 'object',
      properties: {
        user_prompt: { type: 'string', description: 'The user request describing the ad. Pass the original message verbatim or a faithful summary including the offer/product, audience, and any tone hints.' },
        formats: {
          type: 'array',
          items: { type: 'string', enum: ['9:16', '1:1', '4:5', '16:9'] },
          description: 'Optional output formats. Defaults to brief recommendation. Pass multiple for variants (Story + Post + Feed).',
        },
        preset_override: {
          type: 'string',
          enum: ['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo'],
          description: 'Optional style preset override. Pass when user explicitly requests a style ("more luxury", "more aggressive", "minimal"). Otherwise let the brief decide.',
        },
      },
      required: ['user_prompt'],
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
  attachedImages?: Array<{ base64: string; mimeType: string }>;
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



// ─── DYNAMIC TOOL SPECS (Sprint 8) ───────────────────────────────
export async function getToolSpecs(ctx: ToolContext): Promise<ToolSpec[]> {
  let integrationSpecs: IntegrationToolSpec[] = [];
  try {
    integrationSpecs = await getIntegrationToolSpecs(ctx.svc, ctx.orgId, ctx.userId);
  } catch (e) {
    console.warn('[tools] getIntegrationToolSpecs failed:', e);
  }

  const integrationToolSpecs: ToolSpec[] = integrationSpecs.map((s) => ({
    name: s.name as ToolKind,
    description: s.description,
    input_schema: s.input_schema,
  }));

  return [...TOOL_SPECS, ...integrationToolSpecs];
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
      case 'create_ad': return await execCreateAd(input, ctx);
      // ═══ EXTERNAL TOOLS (Sprint 4) ═══
      case 'web_search':
      case 'web_fetch':
      case 'browser_action':
        return await execExternalAdapter(name, input, ctx);
      case 'send_email': {
        // Redirect old coach 'send_email' to Composio gmail_send_email
        const remapped: Record<string, unknown> = {
          recipient_email: input.to ?? input.recipient_email,
          subject: input.subject,
          body: input.body,
          ...(input.is_html !== undefined ? { is_html: input.is_html } : {}),
          ...(input.cc ? { cc: input.cc } : {}),
          ...(input.bcc ? { bcc: input.bcc } : {}),
        };
        const r = await executeIntegrationTool('gmail_send_email', remapped, {
          orgId: ctx.orgId, userId: ctx.userId, svc: ctx.svc,
        });
        return r.ok
          ? { ok: true, result: typeof r.result === 'object' && r.result !== null && '__action_pending__' in r.result
              ? r.result as Record<string, unknown>
              : { text: typeof r.result === 'string' ? r.result : JSON.stringify(r.result) } }
          : { ok: false, error: r.error };
      }
      case 'read_emails': {
        const remapped: Record<string, unknown> = {
          query: input.query ?? '',
          max_results: input.max_results ?? 10,
        };
        const r = await executeIntegrationTool('gmail_search_emails', remapped, {
          orgId: ctx.orgId, userId: ctx.userId, svc: ctx.svc,
        });
        return r.ok
          ? { ok: true, result: { text: typeof r.result === 'string' ? r.result : JSON.stringify(r.result) } }
          : { ok: false, error: r.error };
      }
      default: {
        const nameStr = String(name);
        if (isIntegrationTool(nameStr)) {
          const r = await executeIntegrationTool(nameStr, input, {
            orgId: ctx.orgId,
            userId: ctx.userId,
            svc: ctx.svc,
          });
          return r.ok
            ? { ok: true, result: { text: typeof r.result === 'string' ? r.result : JSON.stringify(r.result) } }
            : { ok: false, error: r.error };
        }
        return { ok: false, error: 'Unknown tool: ' + nameStr };
      }
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
          model: 'gpt-image-2',
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

  // ═══ CREATE MODE: gpt-image-1 via /api/images/generate ═══
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
        model: 'gpt-image-2',
        enhance: false,
      }),
      signal: ctx.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      console.error('[tools.image] create failed:', res.status, errText);
      return { ok: false, error: `Image creation failed (${res.status})` };
    }

    const data = (await res.json()) as { url?: string; urls?: string[] };
    const urls = data.urls || (data.url ? [data.url] : []);
    if (urls.length === 0) return { ok: false, error: 'No image returned' };
    return { ok: true, result: { urls } };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Create failed';
    console.error('[tools.image] create exception:', errMsg);
    return { ok: false, error: errMsg };
  }
}

// ── VIDEO ─────────────────────────────────────────────────────────
async function execVideo(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const userPrompt = String(input.prompt ?? '').trim();
  if (!userPrompt) return { ok: false, error: 'Empty prompt' };
  const duration = Number(input.duration ?? 4);

  try {
    // ═══ ENRIQUECER PROMPT CON BRAIN-BRIDGE (mismo cerebro que create_ad) ═══
    let enrichedPrompt = userPrompt;
    try {
      const { generateCreativePlan } = await import('@/lib/ads/brain-bridge');
      const plan = await generateCreativePlan({
        userPrompt,
        aspectRatios: ['16:9'], // video usa 16:9
      });
      
      enrichedPrompt = [
        plan.promptBase,
        'VISUAL STYLE:',
        `Mood: ${plan.visualStyle.mood}`,
        `Colors: ${plan.visualStyle.colors.join(', ')}`,
        `Lighting: ${plan.visualStyle.lighting}`,
        `Composition: ${plan.visualStyle.composition}`,
        'FORMAT: Cinematic video, smooth camera movement, high production value',
        plan.brandContext?.brand_name ? `BRAND: ${plan.brandContext.brand_name}` : '',
      ].filter(Boolean).join('\n');
      
      console.log('[execVideo] 🧠 prompt enriquecido con brain-bridge');
    } catch (e) {
      console.warn('[execVideo] brain-bridge enrichment failed, usando prompt original:', e);
    }

    // Llamar a /api/videos/generate con el prompt enriquecido
    const res = await fetch(`${ctx.origin}/api/videos/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ctx.cookieHeader ? { cookie: ctx.cookieHeader } : {}),
      },
      body: JSON.stringify({
        prompt: enrichedPrompt,
        duration,
        aspectRatio: '16:9',
      }),
      signal: ctx.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      return { ok: false, error: `Video generation failed (${res.status}): ${errText.slice(0, 200)}` };
    }

    const data = await res.json() as { video?: { url?: string; id?: string }; ok?: boolean };
    const videoUrl = data?.video?.url;
    
    if (!videoUrl) return { ok: false, error: 'No video URL returned' };
    return { ok: true, result: { videoUrl } };
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

// ── CREATE AD (full pipeline) — usando el nuevo sistema nervioso central ──
async function execCreateAd(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const userPrompt = String(input.user_prompt ?? '').trim();
  if (!userPrompt) return { ok: false, error: 'Empty user_prompt' };

  const formats = Array.isArray(input.formats) ? (input.formats as string[]) : undefined;
  const presetOverride = input.preset_override ? String(input.preset_override) : undefined;

  // Fetch brand context (logo + brand info) so the pipeline auto-applies them
  let logoUrl: string | undefined;
  let brandContext: { brand_name?: string; description?: string; vibe?: string } | undefined;
  try {
    const { data: brand } = await ctx.svc
      .from('brand_profile')
      .select('brand_name, description, vibe, logo_url')
      .eq('org_id', ctx.orgId)
      .maybeSingle();
    if (brand) {
      const b = brand as Record<string, unknown>;
      logoUrl = b.logo_url ? String(b.logo_url) : undefined;
      brandContext = {
        brand_name: b.brand_name ? String(b.brand_name) : undefined,
        description: b.description ? String(b.description) : undefined,
        vibe: b.vibe ? String(b.vibe) : undefined,
      };
    }
  } catch {
    /* non-fatal */
  }

  const images = ctx.attachedImages && ctx.attachedImages.length > 0
    ? ctx.attachedImages
    : undefined;
  console.log('[execCreateAd] images:', images ? images.length : 0, 'logoUrl:', logoUrl ? 'yes' : 'no');

  try {
    // ═══ NUEVO SISTEMA: brain-bridge + job-processor (sin HTTP interno) ═══
    const { generateCreativePlan } = await import('@/lib/ads/brain-bridge');
    const { processJob } = await import('@/lib/ads/job-processor');
    const { createJob, getJob } = await import('@/lib/ads/job-manager');
    const { parseAspectRatios } = await import('@/lib/ads/aspect-ratio');

    // Crear el Creative Plan usando todo el DNA
    // Si el usuario no especifica formatos, generamos 1 sola variante (1:1)
    // Solo si pide "campaña" o varios formatos, generamos múltiples
    const resolvedFormats = formats && formats.length > 0 
      ? parseAspectRatios(formats) 
      : ['1:1']; // default: una sola imagen cuadrada
    
    const plan = await generateCreativePlan({
      userPrompt,
      brandContext,
      logoUrl,
      images,
      aspectRatios: resolvedFormats as ('9:16' | '1:1' | '4:5' | '16:9' | '3:2')[],
      presetOverride,
    });

    // Crear job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await createJob({
      jobId,
      creativePlanId: plan.creativePlanId,
      orgId: ctx.orgId,
      userId: ctx.userId,
      creativePlan: plan,
    });

    // Procesar job (genera imágenes con límite de concurrencia)
    await processJob({
      jobId,
      plan,
      orgId: ctx.orgId,
      userId: ctx.userId,
      logoUrl,
    });

    // Recuperar resultados
    const job = await getJob(jobId);
    if (!job) return { ok: false, error: 'Job not found after processing' };

    const urls = (job.results || [])
      .filter(r => r.status === 'completed' && r.url)
      .map(r => r.url as string);

    if (urls.length === 0) {
      const errors = (job.results || [])
        .filter(r => r.error)
        .map(r => r.error)
        .join('; ');
      console.error('[execCreateAd] no urls generated. errors:', errors);
      return { ok: false, error: errors || 'No ads produced' };
    }

    console.log('[execCreateAd] ✅ generated', urls.length, 'variants');
    return { ok: true, result: { urls } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ad creation failed';
    console.error('[execCreateAd] ❌', msg);
    return { ok: false, error: msg };
  }
}

// ═══ EXTERNAL TOOLS BRIDGE (Sprint 4) ═══
// Conecta el executeTool central con el sistema de adapters externos.
async function execExternalAdapter(
  name: ExternalToolName,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  const result = await executeAdapter(name, input, {
    userId: (ctx as { userId?: string }).userId,
    orgId: (ctx as { orgId?: string }).orgId,
  });

  if (!result.ok) {
    return { ok: false, error: result.error || `${name} failed` };
  }

  // Convertir el resultado del adapter al formato ToolResult esperado
  return {
    ok: true,
    result: {
      text: typeof result.data === 'string' 
        ? result.data 
        : JSON.stringify(result.data, null, 2),
    },
  };
}

