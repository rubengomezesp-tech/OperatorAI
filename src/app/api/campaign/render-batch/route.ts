/**
 * /api/campaign/render-batch
 *
 * Renders all variant briefs from a Brain output in a single request.
 *
 * Flow:
 *   1. Auth + load draft (with brain_output)
 *   2. Convert variantBriefs -> Variant[] via brain-to-variant bridge
 *   3. Update campaign row with variants array (so /api/creative/render works)
 *   4. Resolve org context for Composer V2
 *   5. Call renderVariant() for each variant in parallel (capped concurrency)
 *   6. Upload composed buffers to Storage if applicable
 *   7. Update campaign.rendered_images with URLs
 *   8. Return { variants: [{ id, imageUrl, composedV2 }] }
 *
 * The frontend can then poll OR use SSE (V2). For V1 we wait for all.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { renderVariant } from '@/features/creative-studio/server/render-router';
import { brainOutputToVariants } from '@/features/campaign-brain/server/brain-to-variant';
import type { BrainOutput } from '@/features/campaign-brain/types';
import type { Variant } from '@/features/creative-studio/types';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const BUCKET = 'image-outputs';

interface BatchResult {
  id: string;
  imageUrl: string | null;
  composedV2: boolean;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Parse body
    const body = (await req.json().catch(() => ({}))) as {
      draftId?: string;
      maxVariants?: number;
    };
    if (!body.draftId) {
      return NextResponse.json({ error: 'draftId required' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();

    // 3. Load draft + brain_output
    const { data: draftRaw, error: loadErr } = await svc
      .from('campaigns' as never)
      .select('*')
      .eq('id' as never, body.draftId as never)
      .eq('user_id' as never, user.id as never)
      .single();

    if (loadErr || !draftRaw) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draft = draftRaw as {
      id: string;
      brain_output?: BrainOutput | null;
      org_id?: string | null;
    };

    if (!draft.brain_output) {
      return NextResponse.json(
        { error: 'No brain output yet — run /api/campaign/strategize first' },
        { status: 400 },
      );
    }

    // 4. Convert brain output -> Variant[]
    const allVariants = brainOutputToVariants(draft.brain_output);
    const maxVariants = Math.min(body.maxVariants ?? 4, allVariants.length);
    const variants = allVariants.slice(0, maxVariants);

    // 5. Update campaign row with variants (so legacy /api/creative/render
    //    could also work if needed) AND mark as rendering
    await svc
      .from('campaigns' as never)
      .update({
        variants: variants as never,
        is_draft: false,
      } as never)
      .eq('id' as never, draft.id as never);

    // 6. Resolve org context for Composer V2 brand kit fetch
    let orgId: string | undefined;
    try {
      const ctx = await resolveOrgContext(svc, user.id);
      orgId = ctx.orgId;
    } catch {
      orgId = draft.org_id ?? undefined;
    }

    // 7. Render each variant (parallel, max 2 at a time to avoid OOM)
    const results: BatchResult[] = [];
    const concurrency = 2;
    for (let i = 0; i < variants.length; i += concurrency) {
      const batch = variants.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (variant): Promise<BatchResult> => {
          try {
            const result = await renderVariant({
              variant,
              orgId,
              brief: undefined,
              direction: undefined,
            });

            // If composedBuffer present, upload to Storage
            let finalUrl = result.imageUrl;
            if (result.composedBuffer && orgId) {
              const path = `${orgId}/campaigns/${draft.id}/${variant.id}.png`;
              const { error: upErr } = await svc.storage
                .from(BUCKET)
                .upload(path, result.composedBuffer, {
                  contentType: 'image/png',
                  upsert: true,
                });
              if (!upErr) {
                const { data: signed } = await svc.storage
                  .from(BUCKET)
                  .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
                if (signed?.signedUrl) finalUrl = signed.signedUrl;
              }
            }

            return {
              id: variant.id,
              imageUrl: finalUrl,
              composedV2: !!result.composedV2,
            };
          } catch (err) {
            return {
              id: variant.id,
              imageUrl: null,
              composedV2: false,
              error: (err as Error).message ?? 'Render failed',
            };
          }
        }),
      );
      results.push(...batchResults);
    }

    // 8. Save rendered URLs to campaign row
    const renderedMap: Record<string, string> = {};
    for (const r of results) {
      if (r.imageUrl) renderedMap[r.id] = r.imageUrl;
    }
    await svc
      .from('campaigns' as never)
      .update({
        rendered_images: renderedMap as never,
      } as never)
      .eq('id' as never, draft.id as never);

    return NextResponse.json({
      campaignId: draft.id,
      variants: results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Unexpected error' },
      { status: 500 },
    );
  }
}
