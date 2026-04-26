/**
 * POST /api/brand/font/upload
 *
 * Multipart font upload (WOFF2/WOFF/TTF/OTF, max 2MB).
 *
 * Form fields:
 *   - file: File (font binary)
 *   - role: 'primary' | 'display'
 *   - family: string (optional override)
 *   - weight: number (optional override)
 *
 * Auth: requires authenticated user with an active org.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/lib/auth';
import { uploadFont } from '@/lib/brand-os';

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

    // ── 2. Parse form ────────────────────────────────────────────
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

    // ── 3. Convert to Buffer ─────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // ── 4. Upload via brand-os helper ────────────────────────────
    const result = await uploadFont({
      supabase: svc,
      orgId,
      source: buffer,
      contentType: file.type || 'application/octet-stream',
      familyOverride: familyOverride ?? undefined,
      weightOverride,
    });

    // ── 5. Update brand_profile.font_files JSONB ─────────────────
    const { data: existing } = await svc
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

    const { error: updateError } = await svc
      .from('brand_profile')
      .upsert(
        {
          org_id: orgId,
          font_files: fontFiles,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: 'org_id' }
      );

    if (updateError) {
      console.warn('[brand/font/upload] DB update failed but file is uploaded', {
        error: updateError.message,
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
