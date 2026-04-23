import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { planCampaign } from '@/features/creative-studio/server/creative-planner';
import { renderWithQuality } from '@/features/creative-studio/server/render-router';
import type {
  Variant,
  CampaignMemory,
  ProductBrief,
  ImageAnalysis,
  AspectRatio,
  QualityReport,
} from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

const Body = z.object({
  campaignId: z.string().uuid(),
  variantId: z.string(),
});

type RegenOk = {
  ok: true;
  variant: Variant;
  imageUrl: string;
  engine: string;
  qualityReport: QualityReport | null;
  memory: CampaignMemory;
};

type RegenFail = {
  ok: false;
  error: string;
  code:
    | 'NOT_AUTHENTICATED'
    | 'CAMPAIGN_NOT_FOUND'
    | 'VARIANT_NOT_FOUND'
    | 'PLAN_FAILED'
    | 'RATE_LIMITED'
    | 'TIMEOUT'
    | 'GENERATION_FAILED'
    | 'INVALID_INPUT'
    | 'INTERNAL';
};

type RegenResponse = RegenOk | RegenFail;

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return json({
      ok: false,
      error: 'Invalid request body',
      code: 'INVALID_INPUT',
    });
  }

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
      'image_urls, analyses, brief, variants, memory, aspect_ratio, rendered_images, quality_reports',
    )
    .eq('id', body.campaignId)
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

  const campaign = row as {
    image_urls: string[];
    analyses: ImageAnalysis[];
    brief: ProductBrief;
    variants: Variant[];
    memory: CampaignMemory;
    aspect_ratio: AspectRatio;
    rendered_images: Record<string, string> | null;
    quality_reports: Record<string, QualityReport> | null;
  };

  const oldVariant = campaign.variants.find((v) => v.id === body.variantId);
  if (!oldVariant) {
    return json({
      ok: false,
      error: 'Variant not found',
      code: 'VARIANT_NOT_FOUND',
    });
  }

  const updatedMemory: CampaignMemory = {
    previousVariants: [...campaign.memory.previousVariants, oldVariant],
    rejectedVariantIds: [
      ...campaign.memory.rejectedVariantIds,
      oldVariant.id,
    ],
    selectedVariantId: campaign.memory.selectedVariantId,
    userEdits: campaign.memory.userEdits,
    regenerationCount: campaign.memory.regenerationCount + 1,
  };

  let newVariants: Variant[];
  try {
    newVariants = await planCampaign(
      campaign.brief,
      campaign.analyses,
      campaign.aspect_ratio,
      updatedMemory,
    );
  } catch (err) {
    console.error(
      '[regenerate] plan failed',
      JSON.stringify({ campaignId: body.campaignId, error: String(err) }),
    );
    return json({
      ok: false,
      error: err instanceof Error ? err.message : 'Plan failed',
      code: 'PLAN_FAILED',
    });
  }

  const replacement = newVariants.find((v) => v.layout === oldVariant.layout);
  if (!replacement) {
    return json({
      ok: false,
      error: 'Planner did not return a variant with the expected layout',
      code: 'PLAN_FAILED',
    });
  }

  let result: Awaited<ReturnType<typeof renderWithQuality>>;
  try {
    result = await renderWithQuality({
      variant: replacement,
      imageUrls: campaign.image_urls,
      analyses: campaign.analyses,
    });
  } catch (err) {
    const mapped = mapRenderError(err);
    console.error(
      '[regenerate] render failed',
      JSON.stringify({
        campaignId: body.campaignId,
        variantId: body.variantId,
        code: mapped.code,
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

  const nextVariants = campaign.variants.map((v) =>
    v.id === oldVariant.id ? replacement : v,
  );

  const nextImages = { ...(campaign.rendered_images || {}) };
  delete nextImages[oldVariant.id];
  nextImages[replacement.id] = result.imageUrl;

  const nextReports = { ...(campaign.quality_reports || {}) };
  delete nextReports[oldVariant.id];
  if (result.qualityReport) {
    nextReports[replacement.id] = result.qualityReport;
  }

  const { error: updErr } = await svc
    .from('campaigns' as any)
    .update({
      variants: nextVariants,
      memory: updatedMemory,
      rendered_images: nextImages,
      quality_reports: nextReports,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.campaignId)
    .eq('user_id', user.id);

  if (updErr) {
    console.error(
      '[regenerate] persist failed',
      JSON.stringify({ campaignId: body.campaignId, error: updErr.message }),
    );
    return json({
      ok: false,
      error: 'Failed to persist regenerated variant',
      code: 'INTERNAL',
    });
  }

  return json({
    ok: true,
    variant: replacement,
    imageUrl: result.imageUrl,
    engine: result.engine,
    qualityReport: result.qualityReport ?? null,
    memory: updatedMemory,
  });
}

function json(data: RegenResponse): NextResponse {
  return NextResponse.json(data, { status: 200 });
}

function mapRenderError(err: unknown): RegenFail {
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
    return { ok: false, error: 'Render timed out.', code: 'TIMEOUT' };
  }

  if (
    msgLower.includes('no url') ||
    msgLower.includes('invalid output') ||
    msgLower.includes('prediction failed') ||
    msgLower.includes('canceled')
  ) {
    return { ok: false, error: message, code: 'GENERATION_FAILED' };
  }

  return { ok: false, error: message, code: 'INTERNAL' };
}
