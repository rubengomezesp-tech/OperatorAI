import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { renderWithQuality } from '@/features/creative-studio/server/render-router';
import type { Variant } from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 180;

const Body = z.object({
  campaignId: z.string().uuid(),
  variantId: z.string(),
});

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

    const variant = (campaign.variants as Variant[]).find(
      (v) => v.id === body.variantId,
    );
    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found in campaign' },
        { status: 404 },
      );
    }

    const result = await renderWithQuality({
      variant,
      imageUrls: campaign.image_urls,
      analyses: campaign.analyses,
    });

    // Persist rendered image + quality report
    const renderedImages = {
      ...(campaign.rendered_images || {}),
      [variant.id]: result.imageUrl,
    };
    const qualityReports = {
      ...(campaign.quality_reports || {}),
      ...(result.qualityReport ? { [variant.id]: result.qualityReport } : {}),
    };

    await svc
      .from('campaigns' as any)
      .update({
        rendered_images: renderedImages,
        quality_reports: qualityReports,
      })
      .eq('id', body.campaignId)
      .eq('user_id', user.id);

    return NextResponse.json({
      ok: true,
      imageUrl: result.imageUrl,
      engine: result.engine,
      qualityReport: result.qualityReport,
      retried: result.retried,
    });
  } catch (err) {
    console.error('[render] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
