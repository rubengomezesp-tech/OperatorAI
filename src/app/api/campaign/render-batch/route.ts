/**
 * /api/campaign/render-batch
 *
 * Renders all variant briefs and ensures every returned URL is a
 * signed URL valid for 7 days. Works whether Composer V2 acted or not.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { renderVariant } from '@/features/creative-studio/server/render-router';
import { brainOutputToVariants } from '@/features/campaign-brain/server/brain-to-variant';
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

/**
 * Extract storage path from a Supabase URL (signed or public).
 * Returns null if not a Supabase Storage URL.
 *
 * Examples:
 *   https://xxx.supabase.co/storage/v1/object/sign/image-outputs/path.png?token=...
 *   https://xxx.supabase.co/storage/v1/object/public/image-outputs/path.png
 *   https://xxx.supabase.co/storage/v1/object/image-outputs/path.png
 */
function extractStoragePath(url: string, bucket: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('supabase')) return null;

    const path = u.pathname;
    // Match patterns: /storage/v1/object/{sign,public,}/{bucket}/{rest}
    const patterns = [
      new RegExp(`/storage/v1/object/sign/${bucket}/(.+)$`),
      new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`),
      new RegExp(`/storage/v1/object/${bucket}/(.+)$`),
    ];

    for (const re of patterns) {
      const match = path.match(re);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Given any image URL, return a fresh signed URL valid for 7 days.
 * If we can't (e.g. URL is external), returns the original.
 */
async function ensureSignedUrl(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  imageUrl: string,
): Promise<string> {
  const path = extractStoragePath(imageUrl, BUCKET);
  if (!path) {
    // External URL or can't parse — return as-is
    return imageUrl;
  }

  const { data, error } = await svc.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    // Fallback to original
    return imageUrl;
  }

  return data.signedUrl;
}

// ────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ────────────────────────────────────────────────────────────────

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

    // 2. Body
    const body = (await req.json().catch(() => ({}))) as {
      draftId?: string;
      maxVariants?: number;
    };
    if (!body.draftId) {
      return NextResponse.json({ error: 'draftId required' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();

    // 3. Load draft
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

    // 5. Update campaign row
    await svc
      .from('campaigns' as never)
      .update({
        variants: variants as never,
        is_draft: false,
      } as never)
      .eq('id' as never, draft.id as never);

    // 6. Resolve org for Composer V2
    let orgId: string | undefined;
    try {
      const ctx = await resolveOrgContext(svc, user.id);
      orgId = ctx.orgId;
    } catch {
      orgId = draft.org_id ?? undefined;
    }

    // 7. Render in parallel (max 2 concurrent)
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

            let finalUrl = result.imageUrl;

            // Path A: Composer V2 produced a buffer — upload it
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
                  .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
                if (signed?.signedUrl) {
                  finalUrl = signed.signedUrl;
                }
              }
            } else if (finalUrl) {
              // Path B: No buffer — re-sign whatever URL renderVariant returned
              // (handles cases where renderer returned a short-lived signed URL)
              finalUrl = await ensureSignedUrl(svc, finalUrl);
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

    // 8. Save URLs to campaign row
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
