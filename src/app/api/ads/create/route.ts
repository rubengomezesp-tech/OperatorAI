import { NextResponse, type NextRequest, after } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildAdVisualPrompt, type AdPreset } from '@/lib/ads/visual-prompt';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PresetEnum = z.enum(['luxury-minimal', 'luxury-editorial', 'aggressive-bold', 'aggressive-sport', 'aggressive', 'clean-conversion', 'product-demo', 'tech-futuristic', 'storytelling-warm']);
const AspectEnum = z.enum(['9:16', '1:1', '4:5', '16:9']);

const BodySchema = z.object({
  userPrompt: z.string().min(1).max(2000),
  images: z
    .array(
      z.object({
        base64: z.string().min(1),
        mimeType: z.string().default('image/png'),
      }),
    )
    .max(5)
    .optional(),
  logoUrl: z.string().url().optional(),
  brandContext: z
    .object({
      brand_name: z.string().optional(),
      description: z.string().optional(),
      vibe: z.string().optional(),
    })
    .optional(),
  formats: z.array(AspectEnum).max(4).optional(),
  enableAudit: z.boolean().default(true),
  presetOverride: PresetEnum.optional(),
  aspectRatioOverride: AspectEnum.optional(),
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

export async function POST(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

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
    // ── CAPA 1: Analyze assets (optional)
    let assetAnalysis: unknown = undefined;
    if (body.images && body.images.length > 0) {
      assetAnalysis = await runStage('analyze-assets', () =>
        internalPost('/api/ads/analyze-assets', { images: body.images }),
      );
    }

    // ── CAPA 2: Generate brief
    type BriefResponse = {
      objective: string;
      audience: string;
      pain: string;
      concept: string;
      preset: AdPreset;
      aspectRatio: string;
      copy: { headline: string; subheadline: string; cta: string };
      visualPrompt: string;
    };

    const brief = await runStage('brief', () =>
      internalPost<BriefResponse>('/api/ads/brief', {
        userPrompt: body.userPrompt,
        assetAnalysis,
        brandContext: body.brandContext,
      }),
    );

    // Apply overrides if provided
    const effectivePreset = (body.presetOverride ?? brief.preset) as AdPreset;
    const effectiveAspectRatio = body.aspectRatioOverride ?? brief.aspectRatio;

    // ── Filtrado por tipo (CAPA 1): logos NO van como reference (van a overlay)
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
    console.log('[ads/create] images received:', body.images?.length ?? 0, '| refs (no logos):', _refImages.length);

    // ── CAPA 3: Mega-Prompt Composer (todo dentro de la imagen, sin Satori)
    type ExtendedBrief = typeof brief & {
      microCopy?: string;
      featureIcons?: Array<{ icon: string; label: string }>;
      trustSignals?: string[];
      composition?: string;
      typography?: string;
      colorStrategy?: string;
      framework?: 'before-after' | 'social-proof' | 'problem-agitation' | 'lifestyle' | 'direct-offer' | 'demo' | 'awareness';
    };
    const eb = brief as ExtendedBrief;
    const { prompt: visualPrompt } = buildAdVisualPrompt({
      preset: effectivePreset,
      aspectRatio: effectiveAspectRatio as '9:16' | '1:1' | '4:5' | '16:9',
      copy: brief.copy,
      microCopy: eb.microCopy,
      featureIcons: eb.featureIcons,
      trustSignals: eb.trustSignals,
      hasReference: _hasReference,
      brandName: body.brandContext?.brand_name,
      composition: eb.composition,
      typography: eb.typography,
      colorStrategy: eb.colorStrategy,
      framework: eb.framework,
    });
    console.log('[ads/create] mega-prompt length:', visualPrompt.length, '| preset:', effectivePreset);

    // ── Image generation
    type ImageGenResponse = {
      id: string;
      url?: string;
      urls?: string[];
    };

    const imageGen = await runStage('image-gen', () =>
      internalPost<ImageGenResponse>('/api/images/generate', {
        prompt: visualPrompt,
        aspectRatio: effectiveAspectRatio,
        model: 'gpt-image-2',
        enhance: false,
        referenceImages: _hasReference ? _refImages : undefined,
      }),
    );

    const baseImageUrl = imageGen.url ?? imageGen.urls?.[0];
    if (!baseImageUrl) throw new Error('No image URL returned from image generation');

    // ── CAPA 4: Skipped — gpt-image-1 already rendered the complete ad with mega-prompt.
    // The image returned from /api/images/generate IS the final ad (text, CTA, icons, all baked in).
    // No need for Satori overlay composition.
    const formats = body.formats && body.formats.length > 0
      ? body.formats
      : [effectiveAspectRatio as '9:16' | '1:1' | '4:5' | '16:9'];

    const formatOutputs: FormatOutput[] = [];

    // Use the gpt-image-1 output directly as the primary format
    formatOutputs.push({
      format: formats[0],
      url: baseImageUrl,
      storagePath: undefined,
    });

    // For additional formats, regenerate via gpt-image-1 with the same mega-prompt at different aspect
    if (formats.length > 1) {
      type ImageGenResp = { url?: string; urls?: string[] };
      const extraStart = Date.now();
      const extraPromises = formats.slice(1).map(async (fmt) => {
        try {
          const { prompt: extraPrompt } = buildAdVisualPrompt({
            preset: effectivePreset,
            aspectRatio: fmt as '9:16' | '1:1' | '4:5' | '16:9',
            copy: brief.copy,
            microCopy: eb.microCopy,
            featureIcons: eb.featureIcons,
            trustSignals: eb.trustSignals,
            hasReference: _hasReference,
            brandName: body.brandContext?.brand_name,
            composition: eb.composition,
            typography: eb.typography,
            colorStrategy: eb.colorStrategy,
            framework: eb.framework,
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

    // ── CAPA 7: Audit MOVIDO a after() — corre en background, no bloquea respuesta
    // El usuario recibe la imagen YA. El audit se persiste para analítica posterior.
    if (body.enableAudit) {
      after(async () => {
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
              console.warn('[ads/create] audit failed (background):', err instanceof Error ? err.message : err);
            }
          });
          await Promise.all(auditPromises);
          console.log('[ads/create] audit completed in background');
        } catch (e) {
          console.warn('[ads/create] background audit error:', e);
        }
      });
      stages.push({ stage: 'audit', ok: true, latencyMs: 0 }); // 0 porque ya no bloquea
    }

    return NextResponse.json({
      brief: {
        ...brief,
        preset: effectivePreset,
        aspectRatio: effectiveAspectRatio,
      },
      baseImageUrl,
      results: formatOutputs,
      stages,
      totalLatencyMs: Date.now() - totalStart,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline failed';
    console.error('[ads/create] failed:', err);
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
