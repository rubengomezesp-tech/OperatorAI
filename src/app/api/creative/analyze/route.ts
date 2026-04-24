import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { analyzeImages } from '@/features/creative-studio/server/vision-layer';
import { synthesizeBrief } from '@/features/creative-studio/server/understanding-layer';
import { deriveCampaignDirection } from '@/features/creative-studio/server/creative-brain';
import type {
  CampaignIntent,
  AspectRatio,
  BrandAssets,
} from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

const BrandAssetsSchema = z.object({
  logoUrl: z.string().url(),
  brandName: z.string().max(120).optional(),
  slogan: z.string().max(240).optional(),
  palette: z.array(z.string()).max(8).optional(),
  fontNotes: z.string().max(500).optional(),
  defaultLogoPosition: z
    .enum(['top-left', 'top-right', 'top-center', 'bottom-center'])
    .optional(),
});

const Body = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(10),
  brandAssets: BrandAssetsSchema.optional(),
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

    // Enrich brand assets with automatic logo analysis if provided
    let brandAssets: BrandAssets | undefined = body.brandAssets;
    if (brandAssets?.logoUrl) {
      try {
        const logoAnalyses = await analyzeImages([brandAssets.logoUrl]);
        const logoAnalysis = logoAnalyses[0];
        if (logoAnalysis) {
          // Extract palette from logo if user didn't provide one
          if (!brandAssets.palette || brandAssets.palette.length === 0) {
            brandAssets = {
              ...brandAssets,
              palette: logoAnalysis.dominantColors?.slice(0, 5),
            };
          }
        }
      } catch (err) {
        console.warn('[analyze] logo analysis failed (non-fatal):', err);
      }
    }

    // LAYER 1: Vision on PRODUCT images only
    const analyses = await analyzeImages(body.imageUrls);

    // LAYER 2: Understanding — pass brand context to the brief synthesizer
    const enrichedInstructions = buildEnrichedInstructions(
      body.instructions,
      brandAssets,
    );

    const brief = await synthesizeBrief(
      analyses,
      enrichedInstructions,
      body.locale,
      body.campaignIntent as CampaignIntent,
    );

    // If brand palette exists, merge it into the brief
    if (brandAssets?.palette && brandAssets.palette.length > 0) {
      brief.palette = Array.from(
        new Set([...(brandAssets.palette || []), ...(brief.palette || [])]),
      ).slice(0, 5);
    }
    if (brandAssets?.brandName && !brief.name) {
      brief.name = brandAssets.brandName;
    }

    // LAYER 3: Creative Brain
    const direction = await deriveCampaignDirection(
      brief,
      analyses,
      enrichedInstructions,
    );

    // Persist campaign
    let campaignId = body.campaignId;

    if (campaignId) {
      const { error: upErr } = await svc
        .from('campaigns' as any)
        .update({
          image_urls: body.imageUrls,
          brand_assets: brandAssets ?? null,
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
          brand_assets: brandAssets ?? null,
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
      brandAssets,
    });
  } catch (err) {
    console.error('[analyze] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}

function buildEnrichedInstructions(
  userInstructions: string | undefined,
  brand: BrandAssets | undefined,
): string {
  const parts: string[] = [];
  if (userInstructions) parts.push(userInstructions);
  if (brand) {
    if (brand.brandName) {
      parts.push(`Brand name: ${brand.brandName}.`);
    }
    if (brand.slogan) {
      parts.push(`Tagline/slogan: "${brand.slogan}".`);
    }
    if (brand.fontNotes) {
      parts.push(`Typography preference: ${brand.fontNotes}.`);
    }
    parts.push(
      'Important: reserve clean visual space in the scene for a brand logo overlay (top-right corner by default). Do NOT generate or render any logo, text, or brand mark in the background image itself — the logo will be composited separately in the editor.',
    );
  }
  return parts.join(' ');
}
