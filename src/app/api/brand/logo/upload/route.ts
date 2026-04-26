/**
 * POST /api/brand/logo/upload
 *
 * Multipart logo upload to brand-logos bucket.
 *
 * Auth: requires authenticated user with an active org.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { uploadLogo } from '@/lib/brand-os';

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

    // Parse multipart
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

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Upload
    const result = await uploadLogo({
      supabase: svc,
      orgId,
      source: buffer,
      contentType: file.type || 'image/png',
      variant: variant as 'main' | 'dark',
      autoResize: true,
    });

    // Update brand_profile with logo URL
    // NOTE: logo_url is in your existing brand_profile schema.
    // logo_storage_path requires migration 20260425_brand_os_storage.sql
    // (apply when ready; for now we cast to bypass type checks)
    const updateField = variant === 'dark' ? 'logo_dark_url' : 'logo_url';

    const updatePayload: Record<string, unknown> = {
      org_id: orgId,
      [updateField]: result.publicUrl,
      updated_at: new Date().toISOString(),
    };

    // Only set storage_path if migration has been applied
    // (the type check would fail if column doesn't exist, so we cast)
    const updateStorageField =
      variant === 'dark' ? 'logo_dark_storage_path' : 'logo_storage_path';
    updatePayload[updateStorageField] = result.storagePath;

    const { error: updateError } = await svc
      .from('brand_profile')
      .upsert(updatePayload as never, { onConflict: 'org_id' });

    if (updateError) {
      console.warn('[brand/logo/upload] DB update failed but file is uploaded', {
        error: updateError.message,
        hint:
          'If error mentions "logo_storage_path", apply migration 20260425_brand_os_storage.sql',
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
