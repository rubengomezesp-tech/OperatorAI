/**
 * POST /api/brand/extract-preview
 *
 * Extracts brand DNA from a URL WITHOUT persisting to brand_profile.
 * Used during onboarding wizard for the "Auto-detect" button.
 *
 * Workflow:
 *   1. User pastes URL in onboarding step
 *   2. Frontend calls this endpoint
 *   3. Returns preview: { name, description, logoUrl, colors, fonts }
 *   4. User confirms or edits
 *   5. When user completes onboarding, brand_profile is saved
 *      (the persist happens in /api/onboarding/save with completed=true)
 *
 * Auth: requires authenticated user with active org.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { extractBrandFromUrl } from '@/lib/brand-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface PreviewRequest {
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as PreviewRequest;

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Auth
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Org context optional for preview (user might be onboarding)
    let orgId: string | null = null;
    try {
      const svc = createSupabaseServiceClient();
      const ctx = await resolveOrgContext(svc, user.id);
      orgId = ctx.orgId ?? null;
    } catch {
      // Onboarding user may not have org yet — preview is org-less
    }

    // Extract — but DON'T persist or upload logo (just preview)
    const extracted = await extractBrandFromUrl({
      url: body.url,
      extractColorsFromLogo: true,
    });

    return NextResponse.json({
      name: extracted.name,
      description: extracted.description,
      logoUrl: extracted.logoUrl,
      colors: extracted.colors,
      fonts: extracted.fonts,
      confidence: extracted.confidence,
      method: extracted.method,
      warnings: extracted.warnings,
      // Echo orgId so frontend knows if persistence is possible
      hasOrg: !!orgId,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Brand preview failed',
        details: (err as Error).message,
        hint: 'The URL may be unreachable or blocked by the target site.',
      },
      { status: 500 }
    );
  }
}
