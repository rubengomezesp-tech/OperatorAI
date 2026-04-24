import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { renderFlux } from '@/features/creative-studio/server/renderers/flux-renderer';
import type {
  Variant,
  ImageAnalysis,
  QualityReport,
  CampaignDirection,
} from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

const Body = z.object({
  campaignId: z.string().uuid(),
  variantId: z.string(),
  force: z.boolean().optional(),
});

type RenderOk = {
  ok: true;
  imageUrl: string;
  cached: boolean;
  retried: boolean;
  engine: string;
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

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  if (!body) {
    return json({
      ok: false,
      error: 'Invalid request body',
      code: 'INVALID_INPUT',
    });
  }

  const { campaignId, variantId, force } = body;

  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();

  if (!user) {
    return json({
      ok: false,
      error: 'Not authenticated',
      code: 'NOT_AUTHENTICATED',
    });
  }

  const svc = createSupabaseServiceClient();

  const { data: row, error: loadErr } = await svc
    .from('campaigns' as any)
    .select(
      'image_urls, analyses, variants, rendered_images, quality_reports, direction',
    )
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (loadErr || !row) {
    return json({
      ok: false,
      error: 'Campaign not found',
      code: 'CAMPAIGN_NOT_FOUND',
    });
  }

  const campaign = row as unknown as {
    image_urls: string[];
    analyses: ImageAnalysis[];
    variants: Variant[];
    rendered_images: Record<string, string> | null;
    quality_reports: Record<string, QualityReport> | null;
    direction?: CampaignDirection | null;
  };

  const existingUrl = campaign.rendered_images?.[variantId];
  if (!force && existingUrl && existingUrl.startsWith('http')) {
    return json({
      ok: true,
      imageUrl: existingUrl,
      cached: true,
      retried: false,
      engine: 'cached',
      qualityReport: campaign.quality_reports?.[variantId] ?? null,
    });
  }

  const variant = campaign.variants.find((v) => v.id === variantId);
  if (!variant) {
    return json({
      ok: false,
      error: 'Variant not found',
      code: 'VARIANT_NOT_FOUND',
    });
  }

  let result: { imageUrl: string; engine: 'flux' };
  try {
    result = await renderFlux({
      variant,
      imageUrls: campaign.image_urls,
      analyses: campaign.analyses,
      direction: campaign.direction ?? undefined,
    });
  } catch (err) {
    const mapped = mapRenderError(err);
    console.error(
      '[render] failed',
      JSON.stringify({
        campaignId,
        variantId,
        code: mapped.code,
        error: mapped.error,
      }),
    );
    return json(mapped);
  }

  if (!result.imageUrl) {
    return json({
      ok: false,
      error: 'Renderer returned empty URL',
      code: 'GENERATION_FAILED',
    });
  }

  try {
    await persistRender(
      svc,
      campaignId,
      user.id,
      variantId,
      result.imageUrl,
      null,
    );
  } catch (err) {
    console.error(
      '[render] persist failed (continuing)',
      JSON.stringify({ campaignId, variantId, error: String(err) }),
    );
  }

  return json({
    ok: true,
    imageUrl: result.imageUrl,
    cached: false,
    retried: false,
    engine: result.engine,
    qualityReport: null,
  });
}

async function parseBody(
  req: NextRequest,
): Promise<z.infer<typeof Body> | null> {
  try {
    const raw = await req.json();
    return Body.parse(raw);
  } catch {
    return null;
  }
}

function json(data: RenderResponse): NextResponse {
  return NextResponse.json(data, { status: 200 });
}

function mapRenderError(err: unknown): RenderFail {
  const anyErr = err as any;
  const message = anyErr?.message || String(err);
  const status =
    anyErr?.response?.status ||
    anyErr?.status ||
    (typeof anyErr?.statusCode === 'number' ? anyErr.statusCode : undefined);

  const msgLower = message.toLowerCase();

  const is429 =
    status === 429 ||
    msgLower.includes('429') ||
    msgLower.includes('rate limit') ||
    msgLower.includes('too many');

  if (is429) {
    return {
      ok: false,
      error: 'Replicate rate limit hit. Try again in a few seconds.',
      code: 'RATE_LIMITED',
    };
  }

  if (msgLower.includes('timeout') || msgLower.includes('timed out')) {
    return {
      ok: false,
      error: 'Render timed out.',
      code: 'TIMEOUT',
    };
  }

  if (
    msgLower.includes('no url') ||
    msgLower.includes('invalid output') ||
    msgLower.includes('prediction failed') ||
    msgLower.includes('canceled')
  ) {
    return {
      ok: false,
      error: message,
      code: 'GENERATION_FAILED',
    };
  }

  return {
    ok: false,
    error: message,
    code: 'INTERNAL',
  };
}

async function persistRender(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  campaignId: string,
  userId: string,
  variantId: string,
  imageUrl: string,
  qualityReport: QualityReport | null,
): Promise<void> {
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
