import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { analyzeImages } from '@/features/creative-studio/server/vision-layer';
import { synthesizeBrief } from '@/features/creative-studio/server/understanding-layer';

export const runtime = 'nodejs';
export const maxDuration = 120;

const Body = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(10),
  instructions: z.string().max(500).optional(),
  locale: z.enum(['en', 'es']).default('en'),
  campaignIntent: z
    .enum(['launch', 'conversion', 'branding', 'retargeting'])
    .default('launch'),
  aspectRatio: z.enum(['9:16', '1:1', '4:5']).default('9:16'),
  campaignId: z.string().uuid().optional(),
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
    const { orgId } = await resolveOrgContext(svc, user.id);

    const analyses = await analyzeImages(body.imageUrls);
    const brief = await synthesizeBrief(
      analyses,
      body.instructions,
      body.locale,
      body.campaignIntent,
    );

    // Persist: create new campaign row OR update existing
    let campaignId = body.campaignId;
    if (campaignId) {
      await svc
        .from('campaigns' as any)
        .update({
          image_urls: body.imageUrls,
          instructions: body.instructions || null,
          aspect_ratio: body.aspectRatio,
          campaign_intent: body.campaignIntent,
          locale: body.locale,
          analyses,
          brief,
        })
        .eq('id', campaignId)
        .eq('user_id', user.id);
    } else {
      const { data, error } = await svc
        .from('campaigns' as any)
        .insert({
          org_id: orgId,
          user_id: user.id,
          image_urls: body.imageUrls,
          instructions: body.instructions || null,
          aspect_ratio: body.aspectRatio,
          campaign_intent: body.campaignIntent,
          locale: body.locale,
          analyses,
          brief,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[analyze] insert error:', error);
      } else {
        campaignId = (data as any).id;
      }
    }

    return NextResponse.json({
      ok: true,
      campaignId,
      analyses,
      brief,
    });
  } catch (err) {
    console.error('[analyze] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
