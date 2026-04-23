import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { planCampaign } from '@/features/creative-studio/server/creative-planner';
import type {
  ProductBrief,
  ImageAnalysis,
  CampaignMemory,
  AspectRatio,
  CampaignDirection,
} from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

const Body = z.object({
  campaignId: z.string().uuid(),
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
    const { data, error } = await svc
      .from('campaigns' as any)
      .select('brief, analyses, memory, aspect_ratio, direction')
      .eq('id', body.campaignId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
  return NextResponse.json(
    { error: error?.message || 'Campaign not found' },
    { status: 404 },
  );
}

const row = data as unknown as {
  brief: ProductBrief;
  analyses: ImageAnalysis[];
  memory: CampaignMemory;
  aspect_ratio: AspectRatio;
  direction: CampaignDirection | null;
};


    if (!row.brief || !row.analyses) {
      return NextResponse.json(
        { error: 'Campaign not analyzed yet' },
        { status: 400 },
      );
    }

    const variants = await planCampaign(
      row.brief,
      row.analyses,
      row.aspect_ratio,
      row.memory,
      row.direction || undefined,
    );

    const { error: updErr } = await svc
      .from('campaigns' as any)
      .update({
        variants,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.campaignId)
      .eq('user_id', user.id);

    if (updErr) {
      console.error('[plan] update error:', updErr);
      return NextResponse.json(
        { error: 'Failed to save variants' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, variants });
  } catch (err) {
    console.error('[plan] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
