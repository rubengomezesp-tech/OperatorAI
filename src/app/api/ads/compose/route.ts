import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { AdLayout } from '@/lib/ads/compose/layouts';
import { getFontsForPreset } from '@/lib/ads/compose/fonts';
import { AD_DIMENSIONS, type AdAspectRatio } from '@/lib/ads/compose/dimensions';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  baseImageUrl: z.string().url(),
  logoUrl: z.string().url().optional(),
  copy: z.object({
    headline: z.string().min(1).max(120),
    subheadline: z.string().max(240).optional().default(''),
    cta: z.string().min(1).max(50),
  }),
  preset: z.enum(['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo']),
  aspectRatio: z.enum(['9:16', '1:1', '4:5', '16:9']),
});

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${buf.toString('base64')}`;
}

export async function POST(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const dims = AD_DIMENSIONS[body.aspectRatio as AdAspectRatio];
  const startTime = Date.now();

  try {
    // Load images as data URLs (Satori needs embedded data)
    const [baseImageDataUrl, logoDataUrl] = await Promise.all([
      urlToDataUrl(body.baseImageUrl),
      body.logoUrl ? urlToDataUrl(body.logoUrl) : Promise.resolve(undefined),
    ]);

    // Load fonts
    const fonts = await getFontsForPreset(body.preset);

    // JSX → SVG
    const svg = await satori(
      AdLayout({
        baseImageDataUrl,
        logoDataUrl,
        copy: {
          headline: body.copy.headline,
          subheadline: body.copy.subheadline ?? '',
          cta: body.copy.cta,
        },
        preset: body.preset,
        width: dims.width,
        height: dims.height,
      }),
      {
        width: dims.width,
        height: dims.height,
        fonts,
      },
    );

    // SVG → PNG
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: dims.width },
    });
    const pngBuffer = resvg.render().asPng();

    // Upload to Supabase Storage
    const fileName = `composed-${Date.now()}.png`;
    const storagePath = `${orgId}/composed/${fileName}`;
    const { error: upErr } = await svc.storage
      .from('generated-images')
      .upload(storagePath, pngBuffer, {
        contentType: 'image/png',
        upsert: true,
      });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    const { data: pub } = svc.storage
      .from('generated-images')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      url: pub.publicUrl,
      storagePath,
      width: dims.width,
      height: dims.height,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Compose failed';
    console.error('[ads/compose] failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
