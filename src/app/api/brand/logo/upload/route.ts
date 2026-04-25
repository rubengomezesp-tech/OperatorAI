/**
 * POST /api/brand/logo/upload
 *
 * Multipart logo upload.
 *
 * Form fields:
 *   - file: File (PNG/SVG/JPG/WebP, max 5MB)
 *   - variant: 'main' | 'dark' (optional)
 *
 * Response:
 *   { publicUrl, storagePath, width, height, hasTransparency, warnings }
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadLogo } from '@/lib/brand-os';

// ⚠️ Replace with your real auth helpers
// import { createSupabaseServiceClient } from '@/lib/supabase';
// import { resolveOrgContext } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────
    // const supabase = createSupabaseServiceClient();
    // const { user, orgId } = await resolveOrgContext(supabase, request);
    // if (!user || !orgId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const supabase = null as any;
    const orgId = 'placeholder-org';

    // ── Parse multipart ──────────────────────────────────────────
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

    // ── Convert to Buffer ──────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Upload ────────────────────────────────────────────────────
    const result = await uploadLogo({
      supabase,
      orgId,
      source: buffer,
      contentType: file.type || 'image/png',
      variant: variant as 'main' | 'dark',
      autoResize: true,
    });

    // ── Update brand_profile column ────────────────────────────────
    // const updateField = variant === 'dark' ? 'logo_dark_url' : 'logo_url';
    // const updateStorageField = variant === 'dark' ? 'logo_dark_storage_path' : 'logo_storage_path';
    // await supabase.from('brand_profile').upsert({
    //   org_id: orgId,
    //   [updateField]: result.publicUrl,
    //   [updateStorageField]: result.storagePath,
    // }, { onConflict: 'org_id' });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Logo upload failed',
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
