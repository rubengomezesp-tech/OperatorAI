import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { analyzeImages } from '@/features/creative-studio/server/vision-layer';
import { buildProductBrief } from '@/features/creative-studio/server/understanding-layer';
import { deriveCampaignDirection } from '@/features/creative-studio/server/creative-brain';
import type { CampaignIntent, AspectRatio } from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

const Body = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(10),
  instructions: z.string().max(2000).optional(),
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
    let orgId: string;
    try {
      orgId = (await resolveOrgContext(svc, user.id)).orgId;
    } catch {
      return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
    }

    // LAYER 1: Vision (parallel per image)
    const analyses = await analyzeImages(body.imageUrls);

    // LAYER 2: Understanding (synthesize brief)
    const brief = await buildProductBrief(
      analyses,
      body.locale,
      body.campaignIntent as CampaignIntent,
      body.instructions,
    );

    // LAYER 3: Creative Brain (campaign-level art direction)
    const direction = await deriveCampaignDirection(
      brief,
      analyses,
      body.instructions,
    );

    // Persist campaign row
    let campaignId = body.campaignId;

    if (campaignId) {
      const { error: upErr } = await svc
        .from('campaigns' as any)
        .update({
          image_urls: body.imageUrls,
          instructions: body.instructions || null,
          aspect_ratio: body.aspectRatio as AspectRatio,
          campaign_intent: body.campaignIntent,
          locale: body.locale,
          analyses,
          brief,
          direction,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
        .eq('user_id', user.id);
      if (upErr) {
        console.error('[analyze] update error:', upErr);
        return NextResponse.json(
          { error: 'Failed to update campaign' },
          { status: 500 },
        );
      }
    } else {
      const { data: inserted, error: insErr } = await svc
        .from('campaigns' as any)
        .insert({
          org_id: orgId,
          user_id: user.id,
          image_urls: body.imageUrls,
          instructions: body.instructions || null,
          aspect_ratio: body.aspectRatio as AspectRatio,
          campaign_intent: body.campaignIntent,
          locale: body.locale,
          analyses,
          brief,
          direction,
          variants: [],
          memory: {
            previousVariants: [],
            rejectedVariantIds: [],
            userEdits: {},
            regenerationCount: 0,
          },
          rendered_images: {},
          quality_reports: {},
        })
        .select('id')
        .single();

      if (insErr || !inserted) {
        console.error('[analyze] insert error:', insErr);
        return NextResponse.json(
          { error: 'Failed to create campaign' },
          { status: 500 },
        );
      }
      campaignId = (inserted as any).id as string;
    }

    return NextResponse.json({
      ok: true,
      campaignId,
      analyses,
      brief,
      direction,
    });
  } catch (err) {
    console.error('[analyze] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
