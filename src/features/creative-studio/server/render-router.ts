import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { renderFlux } from '@/features/creative-studio/server/renderers/flux-renderer';
import { evaluateVariant } from '@/features/creative-studio/server/quality-gate';
import { FluxError } from '@/features/image-studio/server/flux-client';
import type {
  Variant,
  ImageAnalysis,
  CampaignDirection,
  QualityReport,
} from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

// ═══════════════════════════════════════════════════════════
// Request schema
// ═══════════════════════════════════════════════════════════

const Body = z.object({
  campaignId: z.string().uuid(),
  variantId: z.string(),
  force: z.boolean().optional(), // bypass idempotency cache
});

// ═══════════════════════════════════════════════════════════
// Response contract — ALWAYS 200, always this shape
// ═══════════════════════════════════════════════════════════

type RenderOk = {
  ok: true;
  imageUrl: string;
  cached: boolean;
  retried: boolean;
  qualityReport: QualityReport | null;
};

type RenderFail = {
  ok: false;
  error: string;
  code:
    | 'NOT_AUTHENTICATED'
    | 'CAMPAIGN_NOT_FOUND'
    | 'VARIANT_NOT_FOUND'
    | 'RATE_LIMITED'
    | 'TIMEOUT'
    | 'GENERATION_FAILED'
    | 'INVALID_INPUT'
    | 'INTERNAL';
};

type RenderResponse = RenderOk | RenderFail;

// Quality gate flag — OFF by default, can be enabled per-env.
const QG_ENABLED = process.env.FLUX_QUALITY_GATE === 'true';

// ═══════════════════════════════════════════════════════════
// Handler
// ═══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  if (!body) return json({ ok: false, error: 'Invalid request body', code: 'INVALID_INPUT' });

  const { campaignId, variantId, force } = body;

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) {
    return json({ ok: false, error: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
  }

  const svc = createSupabaseServiceClient();

  // 1. Load campaign
  const { data: row, error: loadErr } = await svc
    .from('campaigns' as any)
    .select('image_urls, analyses, variants, direction, rendered_images, quality_reports')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (loadErr || !row) {
    return json({ ok: false, error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' });
  }

  const campaign = row as {
    image_urls: string[];
    analyses: ImageAnalysis[];
    variants: Variant[];
    direction: CampaignDirection | null;
    rendered_images: Record<string, string> | null;
    quality_reports: Record<string, QualityReport> | null;
  };

  // 2. Idempotency: if we already have a valid image and not forcing, return it
  const existingUrl = campaign.rendered_images?.[variantId];
  if (!force && existingUrl && existingUrl.startsWith('http')) {
    return json({
      ok: true,
      imageUrl: existingUrl,
      cached: true,
      retried: false,
      qualityReport: campaign.quality_reports?.[variantId] ?? null,
    });
  }

  // 3. Find variant
  const variant = campaign.variants.find((v) => v.id === variantId);
  if (!variant) {
    return json({ ok: false, error: 'Variant not found', code: 'VARIANT_NOT_FOUND' });
  }

  // 4. Render with Flux. Quality gate is opt-in and NEVER breaks delivery.
  let imageUrl: string;
  try {
    const result = await renderFlux({
      variant,
      imageUrls: campaign.image_urls,
      analyses: campaign.analyses,
      direction: campaign.direction || undefined,
    } as any); // renderFlux accepts the extended input shape in v6
    imageUrl = result.imageUrl;
  } catch (err) {
    const mapped = mapRenderError(err);
    console.error(
      '[render] flux failed',
      JSON.stringify({ campaignId, variantId, code: mapped.code, error: mapped.error }),
    );
    return json(mapped);
  }

  if (!imageUrl || !imageUrl.startsWith('http')) {
    return json({
      ok: false,
      error: 'Renderer returned invalid URL',
      code: 'GENERATION_FAILED',
    });
  }

  // 5. Persist the image FIRST so the frontend can show it even if QG fails
  let qualityReport: QualityReport | null = null;
  try {
    await persistRender(svc, campaignId, user.id, variantId, imageUrl, null);
  } catch (err) {
    console.error(
      '[render] persist failed (continuing to QG)',
      JSON.stringify({ campaignId, variantId, error: String(err) }),
    );
    // Don't fail the response — we still have the URL to return
  }

  // 6. Quality gate — optional, isolated in try/catch, never blocks delivery
  if (QG_ENABLED) {
    try {
      qualityReport = await evaluateVariant(variant, imageUrl);
      // Update quality_reports separately
      await persistRender(svc, campaignId, user.id, variantId, imageUrl, qualityReport);
    } catch (err) {
      console.warn(
        '[render] quality gate error (non-fatal)',
        JSON.stringify({ campaignId, variantId, error: String(err) }),
      );
      qualityReport = null;
    }
  }

  return json({
    ok: true,
    imageUrl,
    cached: false,
    retried: false,
    qualityReport,
  });
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

async function parseBody(req: NextRequest): Promise<z.infer<typeof Body> | null> {
  try {
    const raw = await req.json();
    return Body.parse(raw);
  } catch {
    return null;
  }
}

function json(data: RenderResponse): NextResponse {
  // ALWAYS 200. Status lives inside body via `ok`.
  return NextResponse.json(data, { status: 200 });
}

function mapRenderError(err: unknown): RenderFail {
  if (err instanceof FluxError) {
    if (err.code === 'RATE_LIMITED') {
      return {
        ok: false,
        error: 'Replicate rate limit hit. Try again in a few seconds.',
        code: 'RATE_LIMITED',
      };
    }
    if (err.code === 'TIMEOUT') {
      return {
        ok: false,
        error: 'Render timed out. The prediction took too long.',
        code: 'TIMEOUT',
      };
    }
    if (err.code === 'GENERATION_FAILED' || err.code === 'INVALID_OUTPUT') {
      return {
        ok: false,
        error: err.message,
        code: 'GENERATION_FAILED',
      };
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  return { ok: false, error: msg, code: 'INTERNAL' };
}

async function persistRender(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  campaignId: string,
  userId: string,
  variantId: string,
  imageUrl: string,
  qualityReport: QualityReport | null,
): Promise<void> {
  // Read current values first, to avoid clobbering other variants being written in parallel.
  // Using JSONB merge with select+update instead of a raw SQL call for simplicity.
  const { data: current } = await svc
    .from('campaigns' as any)
    .select('rendered_images, quality_reports')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single();

  const currentRow = (current as any) || {};
  const nextImages = {
    ...(currentRow.rendered_images || {}),
    [variantId]: imageUrl,
  };
  const nextReports = qualityReport
    ? {
        ...(currentRow.quality_reports || {}),
        [variantId]: qualityReport,
      }
    : currentRow.quality_reports || {};

  const { error } = await svc
    .from('campaigns' as any)
    .update({
      rendered_images: nextImages,
      quality_reports: nextReports,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Persist failed: ' + error.message);
  }
}
