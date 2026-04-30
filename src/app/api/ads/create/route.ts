import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildAdVisualPrompt, type AdPreset } from '@/lib/ads/visual-prompt';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PresetEnum = z.enum(['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo']);
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

    // ── CAPA 3: Build visual prompt
    const { prompt: visualPrompt } = buildAdVisualPrompt({
      preset: effectivePreset,
      aspectRatio: effectiveAspectRatio as '9:16' | '1:1' | '4:5' | '16:9',
      customAtmosphere: brief.visualPrompt,
    });

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
        model: 'gpt-image-1',
        enhance: false, // visualPrompt is already optimized
      }),
    );

    const baseImageUrl = imageGen.url ?? imageGen.urls?.[0];
    if (!baseImageUrl) throw new Error('No image URL returned from image generation');

    // ── CAPA 4 / 5: Compose
    const formats = body.formats && body.formats.length > 0
      ? body.formats
      : [effectiveAspectRatio as '9:16' | '1:1' | '4:5' | '16:9'];

    type ComposeMultiResponse = {
      results: Array<{
        format: string;
        ok: boolean;
        data?: { url: string; storagePath: string };
        error?: string;
      }>;
    };

    type ComposeSingleResponse = {
      url: string;
      storagePath: string;
    };

    const formatOutputs: FormatOutput[] = [];

    if (formats.length === 1) {
      const composed = await runStage('compose', () =>
        internalPost<ComposeSingleResponse>('/api/ads/compose', {
          baseImageUrl,
          logoUrl: body.logoUrl,
          copy: brief.copy,
          preset: effectivePreset,
          aspectRatio: formats[0],
        }),
      );
      formatOutputs.push({
        format: formats[0],
        url: composed.url,
        storagePath: composed.storagePath,
      });
    } else {
      const multi = await runStage('compose-multi', () =>
        internalPost<ComposeMultiResponse>('/api/ads/compose-multi', {
          baseImageUrl,
          logoUrl: body.logoUrl,
          copy: brief.copy,
          preset: effectivePreset,
          formats,
        }),
      );
      for (const r of multi.results) {
        formatOutputs.push({
          format: r.format,
          url: r.data?.url,
          storagePath: r.data?.storagePath,
          error: r.error,
        });
      }
    }

    // ── CAPA 7: Audit (per format, parallel)
    if (body.enableAudit) {
      const auditStart = Date.now();
      const auditPromises = formatOutputs.map(async (output) => {
        if (!output.url) return;
        try {
          const audit = await internalPost('/api/ads/audit', {
            adImageUrl: output.url,
            brief: {
              copy: brief.copy,
              preset: effectivePreset,
              aspectRatio: output.format,
            },
          });
          output.audit = audit;
        } catch (err) {
          output.audit = { error: err instanceof Error ? err.message : 'Audit failed' };
        }
      });
      await Promise.all(auditPromises);
      stages.push({ stage: 'audit', ok: true, latencyMs: Date.now() - auditStart });
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
