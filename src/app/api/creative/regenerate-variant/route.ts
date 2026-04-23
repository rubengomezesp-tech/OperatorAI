import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { planCampaign } from '@/features/creative-studio/server/creative-planner';
import type {
  Variant,
  CampaignMemory,
  ProductBrief,
  ImageAnalysis,
  AspectRatio,
  QualityReport,
} from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

const Body = z.object({
  campaignId: z.string().uuid(),
  variantId: z.string(),
});

type RegenOk = {
  ok: true;
  variant: Variant;
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
    | 'INVALID_INPUT'
    | 'INTERNAL';
};

type RegenResponse = RegenOk | RegenFail;

/**
 * Re-plans a variant given the campaign memory (so rejected angles are avoided).
 * Does NOT render — the frontend calls /api/creative/render after this with
 * the new variantId. Keeping the endpoint single-purpose avoids dependency
 * cycles with the renderer layer.
 */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return json({ ok: false, error: 'Invalid request body', code: 'INVALID_INPUT' });
  }

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) {
    return json({ ok: false, error: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
  }

  const svc = createSupabaseServiceClient();

  const { data: row, error: loadErr } = await svc
    .from('campaigns' as any)
    .select('analyses, brief, variants, memory, aspect_ratio, rendered_images, quality_reports')
    .eq('id', body.campaignId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (loadErr || !row) {
    return json({ ok: false, error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' });
  }

  const campaign = row as unknown as {
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
    return json({ ok: false, error: 'Variant not found', code: 'VARIANT_NOT_FOUND' });
  }

  const updatedMemory: CampaignMemory = {
    previousVariants: [...campaign.memory.previousVariants, oldVariant],
    rejectedVariantIds: [...campaign.memory.rejectedVariantIds, oldVariant.id],
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

  const nextVariants = campaign.variants.map((v) =>
    v.id === oldVariant.id ? replacement : v,
  );

  const nextImages = { ...(campaign.rendered_images || {}) };
  delete nextImages[oldVariant.id];

  const nextReports = { ...(campaign.quality_reports || {}) };
  delete nextReports[oldVariant.id];

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
    memory: updatedMemory,
  });
}

function json(data: RegenResponse): NextResponse {
  return NextResponse.json(data, { status: 200 });
}
