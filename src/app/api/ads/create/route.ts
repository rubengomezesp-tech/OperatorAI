/**
 * /api/ads/create — UNIFIED endpoint
 *
 * Two modes based on Accept header:
 *   - Accept: text/event-stream → SSE with partials (live generation UX)
 *   - Otherwise → JSON response (tool calling, batch generation)
 *
 * Both modes share the SAME pipeline logic.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { waitUntil } from '@vercel/functions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { buildAdVisualPrompt, type AdPreset } from '@/lib/ads/visual-prompt';
import { streamGenerateGptImage } from '@/features/creative-studio/server/gpt-image-client';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { checkUsage, incrementUsage } from '@/lib/billing/usage';
import { isAdsDisabled, isMaintenanceMode } from '@/lib/admin/maintenance';
import {
  generateCreativeDirection,
  detectIntentHints,
  detectVertical,
  buildDirectionBlock,
} from '@/lib/ads/creative-randomizer';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const PresetEnum = z.enum([
  'luxury-minimal', 'luxury-editorial',
  'aggressive-bold', 'aggressive-sport', 'aggressive',
  'clean-conversion', 'product-demo',
  'tech-futuristic', 'storytelling-warm',
]);
const AspectEnum = z.enum(['9:16', '1:1', '4:5', '16:9']);

const BodySchema = z.object({
  userPrompt: z.string().min(1).max(2000),
  images: z.array(z.object({
    base64: z.string().min(1),
    mimeType: z.string().default('image/png'),
  })).max(5).optional(),
  logoUrl: z.string().url().optional(),
  brandContext: z.object({
    brand_name: z.string().optional(),
    description: z.string().optional(),
    vibe: z.string().optional(),
  }).optional(),
  formats: z.array(AspectEnum).max(4).optional(),
  presetOverride: PresetEnum.optional(),
  aspectRatioOverride: AspectEnum.optional(),
  enableAudit: z.boolean().default(true),
  partialImages: z.number().int().min(0).max(3).default(2),
});

interface PipelineStage {
  stage: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

interface FormatOutput {
  format: string;
  url?: string;
  storagePath?: string;
  audit?: unknown;
  error?: string;
}

type BriefResponse = {
  objective: string;
  audience: string;
  pain: string;
  concept: string;
  preset: AdPreset;
  aspectRatio: string;
  copy: { headline: string; subheadline: string; cta: string };
  visualPrompt: string;
  microCopy?: string;
  featureIcons?: Array<{ icon: string; label: string }>;
  trustSignals?: string[];
  composition?: string;
  typography?: string;
  colorStrategy?: string;
  framework?: 'before-after' | 'social-proof' | 'problem-agitation' | 'lifestyle' | 'direct-offer' | 'demo' | 'awareness';
  alternativeCopies?: Array<{ headline: string; subheadline: string; cta: string }>;
};

export async function POST(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  // Kill switches + quotas (admin saltea todo)
  const userEmail = user.email ?? '';
  const isAdminUser = userEmail === 'rubengomezesp@gmail.com';
  if (!isAdminUser) {
    if (await isMaintenanceMode()) {
      return NextResponse.json({ error: 'Maintenance mode' }, { status: 503 });
    }
    if (await isAdsDisabled()) {
      return NextResponse.json({ error: 'Ads generation temporarily disabled' }, { status: 503 });
    }
    try {
      const svc = createSupabaseServiceClient();
      const { orgId } = await resolveOrgContext(svc, user.id);
      if (orgId) {
        const usage = await checkUsage(orgId, 'image_generations');
        if (!usage.ok) {
          return NextResponse.json({
            error: usage.reason === 'no_subscription'
              ? 'Active subscription required to generate images.'
              : 'Monthly image generation limit reached. Upgrade your plan.',
            usage: { used: usage.used, limit: usage.limit, planId: usage.planId },
          }, { status: 402 });
        }
      }
    } catch {
      // En caso de error de check, dejar pasar para no romper experiencia
    }
  }

  const acceptHeader = req.headers.get('accept') ?? '';
  const wantsStream = acceptHeader.includes('text/event-stream');

  // ── Auto-cargar brand_profile si no viene en el body ──
  // Esto asegura que el brief SIEMPRE tenga contexto de marca real,
  // independientemente del cliente (chat tools, AdLiveGenerator, etc.)
  let resolvedBrandContext = body.brandContext;
  let resolvedLogoUrl = body.logoUrl;
  if (!resolvedBrandContext || !resolvedBrandContext.brand_name) {
    try {
      const svc = createSupabaseServiceClient();
      const { orgId } = await resolveOrgContext(svc, user.id);
      if (orgId) {
        const { data: bp } = await svc.from('brand_profile')
          .select('brand_name, description, vibe, logo_url')
          .eq('org_id', orgId)
          .maybeSingle();
        if (bp) {
          const b = bp as Record<string, unknown>;
          resolvedBrandContext = {
            brand_name: b.brand_name ? String(b.brand_name) : undefined,
            description: b.description ? String(b.description) : undefined,
            vibe: b.vibe ? String(b.vibe) : undefined,
          };
          if (!resolvedLogoUrl && b.logo_url) {
            resolvedLogoUrl = String(b.logo_url);
          }
          console.log('[ads/create] auto-loaded brand_profile:', resolvedBrandContext.brand_name ?? 'unnamed');
        }
      }
    } catch (e) {
      console.warn('[ads/create] auto-load brand_profile failed (non-fatal):', e);
    }
  }

  const origin = new URL(req.url).origin;
  const cookieHeader = req.headers.get('cookie') ?? '';

  async function internalPost<T>(path: string, payload: unknown): Promise<T> {
    const res = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${path} (${res.status}): ${errText.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  // ═══════════════════════════════════════════════
  // STREAMING MODE (Accept: text/event-stream)
  // ═══════════════════════════════════════════════
  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            // Connection closed
          }
        };

        try {
          send('stage', { stage: 'analysis', message: 'Analizando tu petición' });

          // ── DNA randomizer: generar dirección creativa ANTES del brief ──
          const intentHints = detectIntentHints(body.userPrompt);
          const detectedVertical = detectVertical(body.userPrompt, resolvedBrandContext?.description);
          const direction = generateCreativeDirection([], intentHints, detectedVertical);
          const directionBlock = buildDirectionBlock(direction);
          console.log('[ads/create:stream] direction:', direction.seedNote);

          // Paralelizamos analyze + brief
          const [assetAnalysis, brief] = await Promise.all([
            body.images && body.images.length > 0
              ? internalPost('/api/ads/analyze-assets', { images: body.images }).catch(() => undefined)
              : Promise.resolve(undefined),
            internalPost<BriefResponse>('/api/ads/brief', {
              userPrompt: body.userPrompt,
              brandContext: resolvedBrandContext,
              creativeDirection: directionBlock,
            }),
          ]);

          send('stage', { stage: 'brief', message: 'Definiendo el concepto creativo' });

          const effectivePreset = (body.presetOverride ?? brief.preset) as AdPreset;
          const effectiveAspectRatio = body.aspectRatioOverride ?? brief.aspectRatio;
          const formats = body.formats && body.formats.length > 0 ? body.formats : [effectiveAspectRatio];

          // Filter logos out
          type AssetAnalysisShape = { assets?: Array<{ type?: string }> };
          const _analysis = assetAnalysis as AssetAnalysisShape | undefined;
          const refImages: Array<{ data: string; mimeType: string }> = [];
          if (body.images && body.images.length > 0) {
            body.images.forEach((img, i) => {
              const detected = _analysis?.assets?.[i]?.type;
              if (detected !== 'logo') {
                refImages.push({ data: img.base64, mimeType: img.mimeType });
              }
            });
          }
          const hasReference = refImages.length > 0;
          console.log('[ads/create:stream] images received:', body.images?.length ?? 0, '| refs (no logos):', refImages.length);

          send('stage', { stage: 'prompt', message: 'Eligiendo dirección creativa' });

          const { prompt: visualPrompt } = buildAdVisualPrompt({
            preset: effectivePreset,
            aspectRatio: effectiveAspectRatio as '9:16' | '1:1' | '4:5' | '16:9',
            copy: brief.copy,
            microCopy: brief.microCopy,
            featureIcons: brief.featureIcons,
            trustSignals: brief.trustSignals,
            hasReference,
            brandName: resolvedBrandContext?.brand_name,
            composition: brief.composition,
            typography: brief.typography,
            colorStrategy: brief.colorStrategy,
            framework: brief.framework,
          });

          send('stage', { stage: 'image', message: 'Generando el visual' });

          const refUrls = refImages.map((r) => `data:${r.mimeType};base64,${r.data}`);

          let finalB64: string | undefined;
          let finalFormat = 'jpeg';

          for await (const evt of streamGenerateGptImage({
            prompt: visualPrompt,
            aspectRatio: (() => { const r = (effectiveAspectRatio?.toString() || '9:16').split('|')[0]; return r === '16:9' ? '1:1' : (r as '1:1' | '9:16' | '4:5'); })(),
            quality: 'medium',
            referenceUrls: refUrls.length > 0 ? refUrls : undefined,
            partialImages: body.partialImages,
          })) {
            if (evt.type === 'partial' && evt.b64) {
              send('partial', { index: evt.partialIndex, b64: evt.b64, format: evt.format });
            } else if (evt.type === 'completed' && evt.b64) {
              finalB64 = evt.b64;
              finalFormat = evt.format ?? 'jpeg';
              send('stage', { stage: 'finalize', message: 'Subiendo a tu workspace' });
            } else if (evt.type === 'error') {
              send('error', { message: evt.error ?? 'Streaming failed' });
              controller.close();
              return;
            }
          }

          if (!finalB64) {
            send('error', { message: 'No se generó imagen final' });
            controller.close();
            return;
          }

          // Upload final
          const svc = createSupabaseServiceClient();
          const fileName = `ads/${user.id}/${Date.now()}.${finalFormat}`;
          const buf = Buffer.from(finalB64, 'base64');
          const { error: upErr } = await svc.storage
            .from('generated-images')
            .upload(fileName, new Uint8Array(buf), {
              contentType: `image/${finalFormat}`,
              upsert: false,
            });
          if (upErr) {
            send('error', { message: `Storage upload failed: ${upErr.message}` });
            controller.close();
            return;
          }

          const { data: pub } = svc.storage.from('generated-images').getPublicUrl(fileName);
          const finalUrl = pub.publicUrl;

          send('result', {
            url: finalUrl,
            format: formats[0],
            brief: {
              ...brief,
              preset: effectivePreset,
              aspectRatio: (effectiveAspectRatio?.toString().split('|')[0] || '9:16'),
            },
          });

          // Audit en background (NO bloquea respuesta SSE)
          if (body.enableAudit) {
            waitUntil((async () => {
              try {
                await fetch(`${origin}/api/ads/audit`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
                  body: JSON.stringify({
                    adImageUrl: finalUrl,
                    brief: {
                      copy: brief.copy,
                      preset: effectivePreset,
                      aspectRatio: formats[0],
                    },
                  }),
                });
              } catch (e) {
                console.warn('[ads/create:stream] audit (bg) failed:', e);
              }
            })());
          }

          send('done', { ok: true });
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Pipeline failed';
          console.error('[ads/create:stream] error:', err);
          send('error', { message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // ═══════════════════════════════════════════════
  // JSON MODE (default — tool calling, batch)
  // ═══════════════════════════════════════════════
  const stages: PipelineStage[] = [];
  const totalStart = Date.now();

  async function runStage<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      stages.push({ stage: name, ok: true, latencyMs: Date.now() - start });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stage failed';
      stages.push({ stage: name, ok: false, latencyMs: Date.now() - start, error: message });
      throw err;
    }
  }

  try {
    let assetAnalysis: unknown = undefined;
    if (body.images && body.images.length > 0) {
      assetAnalysis = await runStage('analyze-assets', () =>
        internalPost('/api/ads/analyze-assets', { images: body.images }),
      );
    }

    // ── DNA randomizer: generar dirección creativa ANTES del brief ──
    const intentHints = detectIntentHints(body.userPrompt);
    const detectedVertical = detectVertical(body.userPrompt, resolvedBrandContext?.description);
    const direction = generateCreativeDirection([], intentHints, detectedVertical);
    const directionBlock = buildDirectionBlock(direction);
    console.log('[ads/create:json] direction:', direction.seedNote);

    const brief = await runStage('brief', () =>
      internalPost<BriefResponse>('/api/ads/brief', {
        userPrompt: body.userPrompt,
        assetAnalysis,
        brandContext: resolvedBrandContext,
        creativeDirection: directionBlock,
      }),
    );

    const effectivePreset = (body.presetOverride ?? brief.preset) as AdPreset;
    const effectiveAspectRatio = body.aspectRatioOverride ?? brief.aspectRatio;

    type AssetAnalysisShape = { assets?: Array<{ type?: string }> };
    const _analysis = assetAnalysis as AssetAnalysisShape | undefined;
    const _refImages: Array<{ data: string; mimeType: string }> = [];
    if (body.images && body.images.length > 0) {
      body.images.forEach((img, i) => {
        const detected = _analysis?.assets?.[i]?.type;
        if (detected !== 'logo') {
          _refImages.push({ data: img.base64, mimeType: img.mimeType });
        }
      });
    }
    const _hasReference = _refImages.length > 0;
    console.log('[ads/create:json] images received:', body.images?.length ?? 0, '| refs (no logos):', _refImages.length);

    const { prompt: visualPrompt } = buildAdVisualPrompt({
      preset: effectivePreset,
      aspectRatio: effectiveAspectRatio as '9:16' | '1:1' | '4:5' | '16:9',
      copy: brief.copy,
      microCopy: brief.microCopy,
      featureIcons: brief.featureIcons,
      trustSignals: brief.trustSignals,
      hasReference: _hasReference,
      brandName: resolvedBrandContext?.brand_name,
      composition: brief.composition,
      typography: brief.typography,
      colorStrategy: brief.colorStrategy,
      framework: brief.framework,
    });

    type ImageGenResponse = { id: string; url?: string; urls?: string[] };

    const imageGen = await runStage('image-gen', () =>
      internalPost<ImageGenResponse>('/api/images/generate', {
        prompt: visualPrompt,
        aspectRatio: (effectiveAspectRatio?.toString().split('|')[0] || '9:16'),
        model: 'gpt-image-2',
        enhance: false,
        referenceImages: _hasReference ? _refImages : undefined,
      }),
    );

    const baseImageUrl = imageGen.url ?? imageGen.urls?.[0];
    if (!baseImageUrl) throw new Error('No image URL returned from image generation');

    const formats = body.formats && body.formats.length > 0
      ? body.formats
      : [effectiveAspectRatio as '9:16' | '1:1' | '4:5' | '16:9'];

    const formatOutputs: FormatOutput[] = [];

    formatOutputs.push({
      format: formats[0],
      url: baseImageUrl,
      storagePath: undefined,
    });

    if (formats.length > 1) {
      type ImageGenResp = { url?: string; urls?: string[] };
      const extraStart = Date.now();
      const extraPromises = formats.slice(1).map(async (fmt) => {
        try {
          const { prompt: extraPrompt } = buildAdVisualPrompt({
            preset: effectivePreset,
            aspectRatio: fmt as '9:16' | '1:1' | '4:5' | '16:9',
            copy: brief.copy,
            microCopy: brief.microCopy,
            featureIcons: brief.featureIcons,
            trustSignals: brief.trustSignals,
            hasReference: _hasReference,
            brandName: resolvedBrandContext?.brand_name,
            composition: brief.composition,
            typography: brief.typography,
            colorStrategy: brief.colorStrategy,
            framework: brief.framework,
          });
          const r = await internalPost<ImageGenResp>('/api/images/generate', {
            prompt: extraPrompt,
            aspectRatio: fmt,
            model: 'gpt-image-2',
            enhance: false,
            referenceImages: _hasReference ? _refImages : undefined,
          });
          return { format: fmt, url: r.url ?? r.urls?.[0] };
        } catch (err) {
          return { format: fmt, error: err instanceof Error ? err.message : 'Format render failed' };
        }
      });
      const extras = await Promise.all(extraPromises);
      extras.forEach((e) => formatOutputs.push({ format: e.format, url: e.url, error: e.error }));
      stages.push({ stage: 'extra-formats', ok: true, latencyMs: Date.now() - extraStart });
    }

    // Audit en background con waitUntil
    if (body.enableAudit) {
      waitUntil((async () => {
        try {
          const auditPromises = formatOutputs.map(async (output) => {
            if (!output.url) return;
            try {
              await internalPost('/api/ads/audit', {
                adImageUrl: output.url,
                brief: {
                  copy: brief.copy,
                  preset: effectivePreset,
                  aspectRatio: output.format,
                },
              });
            } catch (err) {
              console.warn('[ads/create:json] audit (bg) failed:', err instanceof Error ? err.message : err);
            }
          });
          await Promise.all(auditPromises);
        } catch (e) {
          console.warn('[ads/create:json] background audit error:', e);
        }
      })());
      stages.push({ stage: 'audit', ok: true, latencyMs: 0 });
    }

    return NextResponse.json({
      brief: {
        ...brief,
        preset: effectivePreset,
        aspectRatio: (effectiveAspectRatio?.toString().split('|')[0] || '9:16'),
      },
      baseImageUrl,
      results: formatOutputs,
      stages,
      totalLatencyMs: Date.now() - totalStart,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline failed';
    console.error('[ads/create:json] failed:', err);
    return NextResponse.json(
      {
        error: message,
        stages,
        totalLatencyMs: Date.now() - totalStart,
      },
      { status: 500 },
    );
  }
}
