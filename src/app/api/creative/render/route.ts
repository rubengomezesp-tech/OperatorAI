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

function decodeDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }

  const mime = match[1];
  const base64 = match[2];

  return {
    mime,
    buffer: Buffer.from(base64, 'base64'),
  };
}

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
      direction: campaign.direction ?? undefined,
    });

    let finalImageUrl = result.imageUrl;

    console.log(
      '[render-route] result.imageUrl:',
      typeof result.imageUrl,
      String(result.imageUrl).slice(0, 140),
    );

    // Si Flux devolvió data URL, la subimos a Supabase Storage
    if (
      typeof finalImageUrl === 'string' &&
      finalImageUrl.startsWith('data:image/')
    ) {
      const { mime, buffer } = decodeDataUrl(finalImageUrl);
      const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';
      const path =
        'creative-renders/' +
        user.id +
        '/' +
        body.campaignId +
        '/' +
        body.variantId +
        '-' +
        Date.now() +
        '.' +
        ext;

      console.log('[render-route] uploading data URL to storage:', path, mime, buffer.length);

      const upload = await svc.storage.from('images').upload(path, buffer, {
        contentType: mime,
        upsert: true,
      });

      if (upload.error) {
        console.error('[render-route] storage upload failed:', upload.error);
        return NextResponse.json(
          { error: 'Failed to upload rendered image' },
          { status: 500 },
        );
      }

      const signed = await svc.storage
        .from('images')
        .createSignedUrl(path, 60 * 60 * 24 * 7);

      if (signed.error || !signed.data?.signedUrl) {
        console.error('[render-route] signed url failed:', signed.error);
        return NextResponse.json(
          { error: 'Failed to create signed URL for rendered image' },
          { status: 500 },
        );
      }

      finalImageUrl = signed.data.signedUrl;

      console.log(
        '[render-route] signed image url:',
        typeof finalImageUrl,
        String(finalImageUrl).slice(0, 180),
      );
    }

    if (
      typeof finalImageUrl !== 'string' ||
      (!finalImageUrl.startsWith('http') &&
        !finalImageUrl.startsWith('data:image/'))
    ) {
      console.error('[render-route] invalid finalImageUrl:', finalImageUrl);
      return NextResponse.json(
        { error: 'Invalid final image URL returned by renderer' },
        { status: 500 },
      );
    }

    const renderedImages = {
      ...(campaign.rendered_images || {}),
      [variant.id]: finalImageUrl,
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

    console.log(
      '[render-route] persisted url for variant:',
      variant.id,
      String(finalImageUrl).slice(0, 180),
    );

    return NextResponse.json({
      ok: true,
      imageUrl: finalImageUrl,
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
