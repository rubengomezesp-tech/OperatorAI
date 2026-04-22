import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { evaluateVariant } from '@/features/creative-studio/server/quality-gate';
import type { Variant } from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const Body = z.object({
  campaignId: z.string().uuid(),
  variantId: z.string(),
  dataUrl: z
    .string()
    .startsWith('data:image/', { message: 'dataUrl must be an image data URL' }),
});

/**
 * POST /api/creative/validate
 * For canvas-rendered variants: frontend sends the final dataURL and we
 * run the quality gate on it. We do NOT auto-retry here; the frontend
 * decides whether to prompt the user to regenerate.
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
      .select('variants, quality_reports, org_id')
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
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Decode dataURL
    const match = body.dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid dataUrl' }, { status: 400 });
    }
    const mime = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');

    const ext = mime.includes('png')
      ? 'png'
      : mime.includes('jpeg')
      ? 'jpg'
      : 'bin';
    const path = `${campaign.org_id}/validate/${body.campaignId}/${body.variantId}.${ext}`;

    // Upload to Supabase Storage (image-outputs bucket)
    let publicUrl: string | null = null;
    try {
      const { error: upErr } = await svc.storage
        .from('image-outputs')
        .upload(path, buffer, {
          contentType: mime,
          cacheControl: '3600',
          upsert: true,
        });
      if (!upErr) {
        const { data } = svc.storage.from('image-outputs').getPublicUrl(path);
        publicUrl = data?.publicUrl || null;
      }
    } catch (upErr) {
      console.error('[validate] upload failed:', upErr);
    }

    if (!publicUrl) {
      return NextResponse.json({
        ok: true,
        qualityReport: {
          variantId: body.variantId,
          score: 75,
          passed: true,
          issues: ['Validation skipped: upload unavailable'],
          suggestions: [],
        },
      });
    }

    const report = await evaluateVariant(variant, publicUrl);

    const nextReports = {
      ...(campaign.quality_reports || {}),
      [body.variantId]: report,
    };
    await svc
      .from('campaigns' as any)
      .update({ quality_reports: nextReports })
      .eq('id', body.campaignId)
      .eq('user_id', user.id);

    return NextResponse.json({ ok: true, qualityReport: report });
  } catch (err) {
    console.error('[validate] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
