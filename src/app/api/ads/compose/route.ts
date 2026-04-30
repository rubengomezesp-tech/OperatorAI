import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import {
  renderAndUploadAd,
  urlToDataUrl,
  type AdPreset,
} from '@/lib/ads/compose/renderer';
import type { AdAspectRatio } from '@/lib/ads/compose/dimensions';

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

  try {
    const [baseImageDataUrl, logoDataUrl] = await Promise.all([
      urlToDataUrl(body.baseImageUrl),
      body.logoUrl ? urlToDataUrl(body.logoUrl) : Promise.resolve(undefined),
    ]);

    const result = await renderAndUploadAd({
      input: {
        baseImageDataUrl,
        logoDataUrl,
        copy: {
          headline: body.copy.headline,
          subheadline: body.copy.subheadline ?? '',
          cta: body.copy.cta,
        },
        preset: body.preset as AdPreset,
        aspectRatio: body.aspectRatio as AdAspectRatio,
      },
      svc,
      orgId,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Compose failed';
    console.error('[ads/compose] failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
