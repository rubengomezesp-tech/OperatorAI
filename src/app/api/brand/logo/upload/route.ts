/**
 * POST /api/brand/logo/upload
 *
 * Multipart logo upload to brand-logos bucket.
 *
 * Form fields:
 *   - file: File (PNG/SVG/JPG/WebP, max 5MB)
 *   - variant: 'main' | 'dark' (optional, default 'main')
 *
 * Auth: requires authenticated user with an active org.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/lib/auth';
import { uploadLogo } from '@/lib/brand-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'Failed to resolve org' }, { status: 403 });
    }

    // ── 2. Parse multipart form ──────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const variant = (formData.get('variant') as string) ?? 'main';

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (variant !== 'main' && variant !== 'dark') {
      return NextResponse.json(
        { error: "variant must be 'main' or 'dark'" },
        { status: 400 }
      );
    }

    // ── 3. Convert File to Buffer ─────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // ── 4. Upload via brand-os helper ────────────────────────────
    const result = await uploadLogo({
      supabase: svc,
      orgId,
      source: buffer,
      contentType: file.type || 'image/png',
      variant: variant as 'main' | 'dark',
      autoResize: true,
    });

    // ── 5. Update brand_profile with new URL + storage path ──────
    const updateField = variant === 'dark' ? 'logo_dark_url' : 'logo_url';
    const updateStorageField =
      variant === 'dark' ? 'logo_dark_storage_path' : 'logo_storage_path';

    const { error: updateError } = await svc
      .from('brand_profile')
      .upsert(
        {
          org_id: orgId,
          [updateField]: result.publicUrl,
          [updateStorageField]: result.storagePath,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: 'org_id' }
      );

    if (updateError) {
      console.warn('[brand/logo/upload] DB update failed but file is uploaded', {
        error: updateError.message,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: 'Logo upload failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
