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

  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

async function normalizeImageToBuffer(
  imageUrl: string,
): Promise<{ buffer: Buffer; mime: string }> {
  if (imageUrl.startsWith('data:image/')) {
    return decodeDataUrl(imageUrl);
  }

  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch remote image: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/webp';

  return {
    buffer: Buffer.from(arrayBuffer),
    mime: contentType,
  };
}

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  return 'png';
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
      '[render-route] raw image url:',
      String(finalImageUrl).slice(0, 180),
    );

    // IMPORTANT:
    // Never trust replicate.delivery or data URLs for direct frontend display.
    // Always normalize and upload to Supabase Storage.
    if (
      typeof finalImageUrl === 'string' &&
      (finalImageUrl.startsWith('data:image/') ||
        finalImageUrl.includes('replicate.delivery') ||
        finalImageUrl.startsWith('http'))
    ) {
      const { buffer, mime } = await normalizeImageToBuffer(finalImageUrl);
      const ext = extFromMime(mime);

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
        '[render-route] final signed image url:',
        String(finalImageUrl).slice(0, 180),
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

    const { error: updateError } = await svc
      .from('campaigns' as any)
      .update({
        rendered_images: renderedImages,
        quality_reports: qualityReports,
      })
      .eq('id', body.campaignId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[render-route] update failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to persist render result' },
        { status: 500 },
      );
    }

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
