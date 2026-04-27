/**
 * /api/campaigns/list
 *
 * Returns user's saved campaigns (not drafts).
 * Each row includes summary metadata + first thumbnail URL.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CampaignSummary {
  id: string;
  name: string;
  vertical: string | null;
  campaignType: string | null;
  thumbnail: string | null;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function GET(_req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const svc = createSupabaseServiceClient();

    // Fetch saved campaigns (is_draft = false), most recent first
    const { data, error } = await svc
      .from('campaigns' as never)
      .select('*')
      .eq('user_id' as never, user.id as never)
      .eq('is_draft' as never, false as never)
      .is('deleted_at' as never, null as never)
      .order('last_edited_at' as never, { ascending: false } as never)
      .limit(50);

    if (error) {
      console.error('[campaigns/list] query error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as Array<{
      id: string;
      intake_data?: {
        campaignName?: string;
        productName?: string;
      } | null;
      vertical_slug?: string | null;
      campaign_type_slug?: string | null;
      rendered_images?: Record<string, string> | null;
      variants?: Array<{ id: string }> | null;
      created_at?: string;
      updated_at?: string;
      last_edited_at?: string;
    }>;

    const campaigns: CampaignSummary[] = rows.map((r) => {
      const intake = r.intake_data ?? {};
      const renderedImages = r.rendered_images ?? {};
      const firstThumbnail = Object.values(renderedImages)[0] ?? null;
      const variantCount = Array.isArray(r.variants) ? r.variants.length : 0;

      return {
        id: r.id,
        name:
          intake.campaignName ||
          intake.productName ||
          'Untitled campaign',
        vertical: r.vertical_slug ?? null,
        campaignType: r.campaign_type_slug ?? null,
        thumbnail: firstThumbnail,
        variantCount,
        createdAt: r.created_at ?? '',
        updatedAt: r.last_edited_at ?? r.updated_at ?? r.created_at ?? '',
      };
    });

    return NextResponse.json({ ok: true, campaigns });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'List failed' },
      { status: 500 },
    );
  }
}
