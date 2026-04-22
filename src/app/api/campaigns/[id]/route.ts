import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/[id]
 * Returns the full campaign row so the frontend can reconstruct its state
 * after a refresh. RLS is enforced via user_id match.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

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
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const row = data as any;
    return NextResponse.json({
      ok: true,
      campaign: {
        id: row.id,
        orgId: row.org_id,
        userId: row.user_id,
        imageUrls: row.image_urls || [],
        instructions: row.instructions,
        aspectRatio: row.aspect_ratio,
        campaignIntent: row.campaign_intent,
        locale: row.locale,
        analyses: row.analyses,
        brief: row.brief,
        variants: row.variants || [],
        memory: row.memory || {
          previousVariants: [],
          rejectedVariantIds: [],
          userEdits: {},
          regenerationCount: 0,
        },
        renderedImages: row.rendered_images || {},
        qualityReports: row.quality_reports || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (err) {
    console.error('[campaigns/get] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Soft delete via deleted_at.
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const svc = createSupabaseServiceClient();
    const { error } = await svc
      .from('campaigns' as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[campaigns/delete] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
