/**
 * POST /api/brand/font/upload
 *
 * Multipart font upload (WOFF2/WOFF/TTF/OTF, max 2MB).
 *
 * Auth: requires authenticated user with an active org.
 *
 * NOTE: This route persists to brand_profile.font_files JSONB column.
 * That column requires migration 20260425_brand_os_storage.sql.
 * Until applied, the file uploads succeed but DB persist may fail
 * gracefully with a console warning.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { uploadFont } from '@/lib/brand-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // Auth
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

    // Parse form
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

    const weightOverride = weightOverrideRaw
      ? parseInt(weightOverrideRaw, 10)
      : undefined;

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Upload via brand-os helper
    const result = await uploadFont({
      supabase: svc,
      orgId,
      source: buffer,
      contentType: file.type || 'application/octet-stream',
      familyOverride: familyOverride ?? undefined,
      weightOverride,
    });

    // Update brand_profile.font_files JSONB
    // NOTE: font_files column requires migration 20260425_brand_os_storage.sql
    // We cast through `any` to bypass type check until migration applied.
    try {
      const { data: existing } = await (svc as any)
        .from('brand_profile')
        .select('font_files')
        .eq('org_id', orgId)
        .maybeSingle();

      const fontFiles = (existing?.font_files ?? {}) as Record<string, unknown>;
      fontFiles[role] = {
        family: result.detectedFamily,
        weight: result.detectedWeight,
        style: result.detectedStyle,
        woff2_url: result.publicUrl,
        storage_path: result.storagePath,
      };

      const { error: updateError } = await (svc as any)
        .from('brand_profile')
        .upsert(
          {
            org_id: orgId,
            font_files: fontFiles,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'org_id' }
        );

      if (updateError) {
        console.warn('[brand/font/upload] DB update failed but file is uploaded', {
          error: updateError.message,
          hint:
            'If error mentions "font_files", apply migration 20260425_brand_os_storage.sql',
        });
      }
    } catch (dbErr) {
      console.warn('[brand/font/upload] DB persist skipped', {
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
    }

    return NextResponse.json({ ...result, role });
  } catch (err) {
    return NextResponse.json(
      { error: 'Font upload failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
