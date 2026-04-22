import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { planCampaign } from '@/features/creative-studio/server/creative-planner';

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

    const { data: row, error: fetchErr } = await svc
      .from('campaigns' as any)
      .select('*')
      .eq('id', body.campaignId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = row as any;
    if (!campaign.brief || !campaign.analyses) {
      return NextResponse.json(
        { error: 'Campaign missing brief/analyses. Run analyze first.' },
        { status: 400 },
      );
    }

    const variants = await planCampaign(
      campaign.brief,
      campaign.analyses,
      campaign.aspect_ratio,
      campaign.memory, // memory-aware when regenerationCount > 0
    );

    await svc
      .from('campaigns' as any)
      .update({
        variants,
      })
      .eq('id', body.campaignId)
      .eq('user_id', user.id);

    return NextResponse.json({ ok: true, variants });
  } catch (err) {
    console.error('[plan] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
