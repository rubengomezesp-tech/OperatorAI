/**
 * /api/ads/create-stream
 *
 * SSE endpoint that runs the full ad pipeline AND streams partial images
 * as they arrive from gpt-image-2. Frontend gets:
 *   1. event: stage    { stage, message } — pipeline progress
 *   2. event: partial  { index, b64, format } — partial preview from gpt-image-2
 *   3. event: result   { url, brief } — final image uploaded to storage
 *   4. event: error    { message }
 *   5. event: done
 */
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { waitUntil } from '@vercel/functions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { buildAdVisualPrompt, type AdPreset } from '@/lib/ads/visual-prompt';
import { streamGenerateGptImage } from '@/features/creative-studio/server/gpt-image-client';

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

export async function POST(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const body = parsed.data;

  const origin = new URL(req.url).origin;
  const cookieHeader = req.headers.get('cookie') ?? '';
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Connection closed by client
        }
      };

      try {
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

        // ── CAPA 1 + 2 EN PARALELO ──
        send('stage', { stage: 'analysis', message: 'Analizando tu petición' });

        const [assetAnalysis, brief] = await Promise.all([
          body.images && body.images.length > 0
            ? internalPost('/api/ads/analyze-assets', { images: body.images }).catch(() => undefined)
            : Promise.resolve(undefined),
          (async () => {
            type BriefResponse = {
              objective: string; audience: string; pain: string; concept: string;
              preset: AdPreset; aspectRatio: string;
              copy: { headline: string; subheadline: string; cta: string };
              visualPrompt: string;
              microCopy?: string;
              featureIcons?: Array<{ icon: string; label: string }>;
              trustSignals?: string[];
              composition?: string; typography?: string; colorStrategy?: string;
              framework?: 'before-after' | 'social-proof' | 'problem-agitation' | 'lifestyle' | 'direct-offer' | 'demo' | 'awareness';
              alternativeCopies?: Array<{ headline: string; subheadline: string; cta: string }>;
            };
            return internalPost<BriefResponse>('/api/ads/brief', {
              userPrompt: body.userPrompt,
              brandContext: body.brandContext,
            });
          })(),
        ]);

        send('stage', { stage: 'brief', message: 'Definiendo el concepto creativo' });

        // Effective values
        const effectivePreset = (body.presetOverride ?? brief.preset) as AdPreset;
        const effectiveAspectRatio = body.aspectRatioOverride ?? brief.aspectRatio;
        const formats = body.formats && body.formats.length > 0 ? body.formats : [effectiveAspectRatio];

        console.log('[create-stream] body.images:', body.images?.length ?? 0, '| analysis assets:', (assetAnalysis as { assets?: unknown[] } | undefined)?.assets?.length ?? 0);
        // Filter logos out, keep other refs
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

        // Build mega-prompt
        send('stage', { stage: 'prompt', message: 'Eligiendo dirección creativa' });

        const { prompt: visualPrompt } = buildAdVisualPrompt({
          preset: effectivePreset,
          aspectRatio: effectiveAspectRatio as '9:16' | '1:1' | '4:5' | '16:9',
          copy: brief.copy,
          microCopy: brief.microCopy,
          featureIcons: brief.featureIcons,
          trustSignals: brief.trustSignals,
          hasReference,
          brandName: body.brandContext?.brand_name,
          composition: brief.composition,
          typography: brief.typography,
          colorStrategy: brief.colorStrategy,
          framework: brief.framework,
        });

        // ── CAPA 4: STREAM gpt-image-2 ──
        send('stage', { stage: 'image', message: 'Generando el visual' });

        const refUrls = refImages.map((r) => `data:${r.mimeType};base64,${r.data}`);

        let finalB64: string | undefined;
        let finalFormat = 'jpeg';

        for await (const evt of streamGenerateGptImage({
          prompt: visualPrompt,
          aspectRatio: effectiveAspectRatio === '16:9' ? '1:1' : (effectiveAspectRatio as '1:1' | '9:16' | '4:5'),
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

        // Upload final to Supabase Storage
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
            aspectRatio: effectiveAspectRatio,
          },
        });

        // ── CAPA 7: AUDIT en background ──
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
              console.warn('[create-stream] audit (bg) failed:', e);
            }
          })());
        }

        send('done', { ok: true });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Pipeline failed';
        console.error('[create-stream] error:', err);
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
