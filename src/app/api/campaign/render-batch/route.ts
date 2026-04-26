/**
 * /api/campaign/render-batch (Agentic V1)
 *
 * Now uses Agentic Renderer (AG-4) which:
 *   1. Renders variant
 *   2. Critiques with Vision LLM
 *   3. Iterates if score < 70 (max 2 iterations)
 *   4. Returns best result with critique metadata
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { brainOutputToVariantsAsync } from '@/features/campaign-brain/server/brain-to-variant';
import { renderVariantAgentic } from '@/features/campaign-brain/server/agentic-renderer';
import { loadBrandKitForPrompt } from '@/features/campaign-brain/server/premium-prompt-builder';
import type { BrainOutput } from '@/features/campaign-brain/types';
import type { VisionCritique } from '@/features/campaign-brain/server/vision-critic';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface BatchResult {
  id: string;
  imageUrl: string | null;
  composedV2: boolean;
  critique?: {
    score: number;
    verdict: 'pass' | 'iterate' | 'fail';
    summary: string;
    issues: string[];
    suggestions: string[];
    iterationsRun: number;
  };
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Auth
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Body
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

    // Resolve org
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

    // Build variants with premium prompt
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

    // Load brand kit (for critic context)
    const brandKit = await loadBrandKitForPrompt(svc, orgId);

    // Build map: variantId -> variantBrief (for critic)
    const briefById = new Map(
      draft.brain_output.variantBriefs.map((b) => [b.id, b]),
    );

    // Render with agentic loop (max 2 concurrent — heavy due to critique)
    const results: BatchResult[] = [];
    const concurrency = 2;

    for (let i = 0; i < variants.length; i += concurrency) {
      const batch = variants.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (variant): Promise<BatchResult> => {
          const brief = briefById.get(variant.id);
          if (!brief) {
            return {
              id: variant.id,
              imageUrl: null,
              composedV2: false,
              error: 'Brief missing for variant',
            };
          }

          const result = await renderVariantAgentic(
            {
              variant,
              variantBrief: brief,
              brainOutput: draft.brain_output!,
              orgId: orgId!,
              draftId: draft.id,
              brandTone: brandKit?.tone ?? null,
              brandPalette: brandKit?.palette ?? [],
            },
            svc,
          );

          return {
            id: variant.id,
            imageUrl: result.imageUrl,
            composedV2: result.composedV2,
            critique: result.critique
              ? {
                  score: result.critique.score,
                  verdict: result.critique.verdict,
                  summary: result.critique.summary,
                  issues: result.critique.issues,
                  suggestions: result.critique.suggestions,
                  iterationsRun: result.iterationsRun,
                }
              : undefined,
            error: result.error,
          };
        }),
      );
      results.push(...batchResults);
    }

    // Save URLs + critiques to campaign row
    const renderedMap: Record<string, string> = {};
    const critiqueMap: Record<string, unknown> = {};
    for (const r of results) {
      if (r.imageUrl) renderedMap[r.id] = r.imageUrl;
      if (r.critique) critiqueMap[r.id] = r.critique;
    }

    await svc
      .from('campaigns' as never)
      .update({
        rendered_images: renderedMap as never,
        critiques: critiqueMap as never,
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
