/**
 * POST /api/brand/extract
 *
 * Extracts brand DNA from a URL and optionally persists.
 *
 * Request:
 *   { url: string, persist?: boolean }
 *
 * Response:
 *   {
 *     brand: BrandProfile,
 *     extracted: ExtractedBrand,
 *     persisted: boolean,
 *     logoUploaded: boolean,
 *     meta: { durationMs, confidence, warnings }
 *   }
 *
 * Auth: requires authenticated user with org context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { autoDetectBrand } from '@/lib/brand-os';

// ⚠️ Replace with your real auth helpers
// import { createSupabaseServiceClient } from '@/lib/supabase';
// import { resolveOrgContext } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ExtractRequest {
  url: string;
  persist?: boolean;
  downloadLogo?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExtractRequest;

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // ── Auth + org resolution ─────────────────────────────────────
    // const supabase = createSupabaseServiceClient();
    // const { user, orgId } = await resolveOrgContext(supabase, request);
    // if (!user || !orgId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // ⚠️ TEMPORARY — replace with real auth above
    const supabase = null as any;
    const orgId = 'placeholder-org';

    // ── Run pipeline ──────────────────────────────────────────────
    const result = await autoDetectBrand({
      supabase,
      orgId,
      url: body.url,
      persist: body.persist ?? true,
      downloadLogo: body.downloadLogo ?? true,
    });

    return NextResponse.json({
      brand: result.brand,
      extracted: result.extracted,
      persisted: result.persisted,
      logoUploaded: result.logoUploaded,
      meta: result.meta,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Brand extraction failed',
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
