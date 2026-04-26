/**
 * /api/campaign/render-batch (Premium)
 *
 * Now uses async brain-to-variant bridge that:
 *   1. Loads Brand kit from Brand OS
 *   2. Builds premium prompt in 8 layers
 *   3. Passes orgId + product photos to bridge
 *
 * Always downloads external URLs and stores ourselves with 7-day signed URLs.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { renderVariant } from '@/features/creative-studio/server/render-router';
import { brainOutputToVariantsAsync } from '@/features/campaign-brain/server/brain-to-variant';
import type { BrainOutput } from '@/features/campaign-brain/types';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const BUCKET = 'image-outputs';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface BatchResult {
  id: string;
  imageUrl: string | null;
  composedV2: boolean;
  error?: string;
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

async function uploadAndSign(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  path: string,
  buffer: Buffer,
): Promise<string | null> {
  const { error: upErr } = await svc.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'image/png',
      cacheControl: '604800',
      upsert: true,
    });

  if (upErr) return null;

  const { data: signed } = await svc.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  return signed?.signedUrl ?? null;
}

// ────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      draftId?: string;
      maxVariants?: number;
    };
    if (!body.draftId) {
      return NextResponse.json({ error: 'draftId required' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();

    // Load draft
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
      intake_data?: { visualReferences?: string[] } | null;
    };

    if (!draft.brain_output) {
      return NextResponse.json(
        { error: 'No brain output yet — run /api/campaign/strategize first' },
        { status: 400 },
      );
    }

    // Resolve org context
    let orgId: string | undefined;
    try {
      const ctx = await resolveOrgContext(svc, user.id);
      orgId = ctx.orgId;
    } catch {
      orgId = draft.org_id ?? undefined;
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'No organization context — cannot store images' },
        { status: 400 },
      );
    }

    // ★ Premium bridge: loads Brand kit + builds layered prompts
    const productPhotoUrls = draft.intake_data?.visualReferences ?? undefined;
    const allVariants = await brainOutputToVariantsAsync(draft.brain_output, {
      orgId,
      productPhotoUrls,
    });
    const maxVariants = Math.min(body.maxVariants ?? 4, allVariants.length);
    const variants = allVariants.slice(0, maxVariants);

    // Update campaign row
    await svc
      .from('campaigns' as never)
      .update({
        variants: variants as never,
        is_draft: false,
      } as never)
      .eq('id' as never, draft.id as never);

    // Render in parallel (max 2)
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

            const path = `${orgId}/campaigns/${draft.id}/${variant.id}.png`;
            let buffer: Buffer | null = null;

            if (result.composedBuffer) {
              buffer = result.composedBuffer;
            } else if (result.imageUrl) {
              buffer = await downloadImage(result.imageUrl);
            }

            if (!buffer) {
              return {
                id: variant.id,
                imageUrl: null,
                composedV2: false,
                error: 'No image buffer obtained',
              };
            }

            const signedUrl = await uploadAndSign(svc, path, buffer);
            if (!signedUrl) {
              return {
                id: variant.id,
                imageUrl: null,
                composedV2: !!result.composedV2,
                error: 'Upload or signing failed',
              };
            }

            return {
              id: variant.id,
              imageUrl: signedUrl,
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

    // Save URLs
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
