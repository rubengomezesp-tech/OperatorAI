/**
 * POST /api/brand/font/upload
 *
 * Multipart font upload (WOFF2/WOFF/TTF/OTF, max 2MB).
 *
 * Form fields:
 *   - file: File (font binary)
 *   - role: 'primary' | 'display' (which slot in BrandKit.fonts)
 *   - family: string (optional override)
 *   - weight: number (optional override)
 *
 * Response:
 *   { publicUrl, storagePath, detectedFamily, detectedWeight, warnings }
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFont } from '@/lib/brand-os';

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
    const role = (formData.get('role') as string) ?? 'primary';
    const familyOverride = formData.get('family') as string | null;
    const weightOverrideRaw = formData.get('weight') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (role !== 'primary' && role !== 'display') {
      return NextResponse.json(
        { error: "role must be 'primary' or 'display'" },
        { status: 400 }
      );
    }

    const weightOverride = weightOverrideRaw ? parseInt(weightOverrideRaw, 10) : undefined;

    // ── Convert to Buffer ──────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // ── Upload ────────────────────────────────────────────────────
    const result = await uploadFont({
      supabase,
      orgId,
      source: buffer,
      contentType: file.type || 'application/octet-stream',
      familyOverride: familyOverride ?? undefined,
      weightOverride,
    });

    // ── Update brand_profile.font_files JSONB ────────────────────
    // const { data: existing } = await supabase
    //   .from('brand_profile')
    //   .select('font_files')
    //   .eq('org_id', orgId)
    //   .maybeSingle();
    //
    // const fontFiles = (existing?.font_files ?? {}) as Record<string, unknown>;
    // fontFiles[role] = {
    //   family: result.detectedFamily,
    //   weight: result.detectedWeight,
    //   woff2_url: result.publicUrl,
    //   storage_path: result.storagePath,
    // };
    //
    // await supabase
    //   .from('brand_profile')
    //   .upsert({ org_id: orgId, font_files: fontFiles }, { onConflict: 'org_id' });

    return NextResponse.json({
      ...result,
      role,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Font upload failed',
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
