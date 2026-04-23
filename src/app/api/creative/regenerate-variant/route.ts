import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { planCampaign } from '@/features/creative-studio/server/creative-planner';
import { renderWithQuality } from '@/features/creative-studio/server/render-router';
import type { Variant, CampaignMemory } from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 240;

const Body = z.object({
  campaignId: z.string().uuid(),
  variantId: z.string(),
});

/**
 * REGENERATE VARIANT
 * - Pushes the current variant into memory as "rejected"
 * - Re-runs the planner with updated memory
 * - Picks ONLY the new variant that matches the same layout (same slot)
 * - Renders it (with quality gate)
 * - Updates the campaign row so the slot now holds the new variant
 *
 * Does NOT re-render the other 4 variants. Does NOT reset the grid.
 */
export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());

    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const svc = createSupabaseServiceClient();

    const { data: row, error } = await svc
      .from('campaigns' as any)
      .select('*')
      .eq('id', body.campaignId)
      .eq('user_id', user.id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    const campaign = row as any;

    const variants = (campaign.variants as Variant[]) || [];
    const existing = variants.find((v) => v.id === body.variantId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Variant not found in campaign' },
        { status: 404 },
      );
    }

    // Build updated memory with the rejected variant tracked
    const prevMemory: CampaignMemory = campaign.memory || {
      previousVariants: [],
      rejectedVariantIds: [],
      userEdits: {},
      regenerationCount: 0,
    };
    const updatedMemory: CampaignMemory = {
      previousVariants: [
        ...(prevMemory.previousVariants || []),
        existing,
      ].slice(-20), // cap at 20 entries
      selectedVariantId: prevMemory.selectedVariantId,
      rejectedVariantIds: [
        ...(prevMemory.rejectedVariantIds || []),
        existing.id,
      ],
      userEdits: prevMemory.userEdits || {},
      regenerationCount: (prevMemory.regenerationCount || 0) + 1,
    };

    // Plan again with memory context
    const newVariants = await planCampaign(
      campaign.brief,
      campaign.analyses,
      campaign.aspect_ratio,
      updatedMemory,
    );

    // Find the replacement for THIS layout slot
    const replacement = newVariants.find((v) => v.layout === existing.layout);
    if (!replacement) {
      return NextResponse.json(
        { error: 'Planner did not return a variant for this layout' },
        { status: 500 },
      );
    }

    // Ensure new variant id differs from old
    if (replacement.id === existing.id) {
      replacement.id = existing.id + '-r' + updatedMemory.regenerationCount;
    }

    // Render the replacement
    const renderResult = await renderWithQuality({
      variant: replacement,
      imageUrls: campaign.image_urls,
      analyses: campaign.analyses,
    });

    // Swap in variants array
    const updatedVariants = variants.map((v) =>
      v.id === existing.id ? replacement : v,
    );

    // Update rendered_images: remove old entry, add new
    const renderedImages = { ...(campaign.rendered_images || {}) };
    delete renderedImages[existing.id];
    renderedImages[replacement.id] = renderResult.imageUrl;

    // Same for quality_reports
    const qualityReports = { ...(campaign.quality_reports || {}) };
    delete qualityReports[existing.id];
    if (renderResult.qualityReport) {
      qualityReports[replacement.id] = renderResult.qualityReport;
    }

    await svc
      .from('campaigns' as any)
      .update({
        variants: updatedVariants,
        memory: updatedMemory,
        rendered_images: renderedImages,
        quality_reports: qualityReports,
      })
      .eq('id', body.campaignId)
      .eq('user_id', user.id);

    return NextResponse.json({
      ok: true,
      variant: replacement,
      imageUrl: renderResult.imageUrl,
      engine: renderResult.engine,
      qualityReport: renderResult.qualityReport,
      retried: renderResult.retried,
      memory: updatedMemory,
    });
  } catch (err) {
    console.error('[regenerate-variant] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
