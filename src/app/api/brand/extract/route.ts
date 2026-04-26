/**
 * POST /api/brand/extract
 *
 * Extracts brand DNA from a URL and optionally persists to brand_profile.
 *
 * Auth: requires authenticated user with an active org.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { autoDetectBrand } from '@/lib/brand-os';

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
    const body = (await request.json().catch(() => ({}))) as ExtractRequest;

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Auth: validate user via SSR
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Resolve org via service client
    const svc = createSupabaseServiceClient();
    let orgId: string;
    try {
      const ctx = await resolveOrgContext(svc, user.id);
      if (!ctx.orgId) {
        return NextResponse.json(
          { error: 'No active organization for user' },
          { status: 403 }
        );
      }
      orgId = ctx.orgId;
    } catch {
      return NextResponse.json(
        { error: 'Failed to resolve organization context' },
        { status: 403 }
      );
    }

    // Run extraction pipeline
    const result = await autoDetectBrand({
      supabase: svc,
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
      { error: 'Brand extraction failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
