import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import {
  renderAndUploadAd,
  urlToDataUrl,
  type AdPreset,
  type RenderAdOutput,
} from '@/lib/ads/compose/renderer';
import type { AdAspectRatio } from '@/lib/ads/compose/dimensions';

export const runtime = 'nodejs';
export const maxDuration = 120;

const BodySchema = z.object({
  baseImageUrl: z.string().url(),
  logoUrl: z.string().url().optional(),
  copy: z.object({
    headline: z.string().min(1).max(120),
    subheadline: z.string().max(240).optional().default(''),
    cta: z.string().min(1).max(50),
  }),
  preset: z.enum(['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo']),
  formats: z
    .array(z.enum(['9:16', '1:1', '4:5', '16:9']))
    .min(1)
    .max(4),
});

interface FormatResult {
  format: AdAspectRatio;
  ok: boolean;
  data?: RenderAdOutput;
  error?: string;
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

  const startTime = Date.now();

  try {
    // Fetch base + logo ONCE (shared across all formats)
    const [baseImageDataUrl, logoDataUrl] = await Promise.all([
      urlToDataUrl(body.baseImageUrl),
      body.logoUrl ? urlToDataUrl(body.logoUrl) : Promise.resolve(undefined),
    ]);

    // Dedupe formats
    const formats = Array.from(new Set(body.formats)) as AdAspectRatio[];

    // Render all formats in parallel
    const settled = await Promise.allSettled(
      formats.map((format) =>
        renderAndUploadAd({
          input: {
            baseImageDataUrl,
            logoDataUrl,
            copy: {
              headline: body.copy.headline,
              subheadline: body.copy.subheadline ?? '',
              cta: body.copy.cta,
            },
            preset: body.preset as AdPreset,
            aspectRatio: format,
          },
          svc,
          orgId,
        }),
      ),
    );

    const results: FormatResult[] = settled.map((s, i) => {
      const format = formats[i];
      if (s.status === 'fulfilled') {
        return { format, ok: true, data: s.value };
      }
      return {
        format,
        ok: false,
        error: s.reason instanceof Error ? s.reason.message : 'Render failed',
      };
    });

    const successCount = results.filter((r) => r.ok).length;

    return NextResponse.json({
      results,
      successCount,
      totalCount: formats.length,
      totalLatencyMs: Date.now() - startTime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Multi-compose failed';
    console.error('[ads/compose-multi] failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
