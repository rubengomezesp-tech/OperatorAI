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
import type { AutoDetectResult } from '@/lib/brand-os/auto-detect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ExtractRequest {
  url: string;
  persist?: boolean;
  downloadLogo?: boolean;
}

function uniqueHex(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!value || !/^#[0-9a-f]{6}$/i.test(value)) continue;
    const hex = value.toLowerCase();
    if (seen.has(hex)) continue;
    seen.add(hex);
    out.push(hex);
  }
  return out;
}

function buildExtractedPayload(result: AutoDetectResult, orgId: string) {
  const extracted = result.extracted;
  const colorList = uniqueHex([
    extracted.colors.primary,
    extracted.colors.secondary,
    extracted.colors.accent,
    extracted.colors.background,
    ...(extracted.colors.palette ?? []).map((color) => color.hex),
  ]).slice(0, 10);

  const fontList = [
    extracted.fonts?.primary?.family,
    extracted.fonts?.display?.family,
    ...(extracted.fonts?.detected ?? []),
  ].filter((font, index, fonts): font is string => Boolean(font) && fonts.indexOf(font) === index);

  const payload: Record<string, unknown> = {
    org_id: orgId,
    updated_at: new Date().toISOString(),
  };

  if (extracted.name) payload.brand_name = extracted.name;
  if (extracted.description) payload.description = extracted.description;
  if (extracted.industry) payload.industry = extracted.industry;
  if (result.brand.logoUrl) payload.logo_url = result.brand.logoUrl;
  if (colorList.length > 0) payload.colors = colorList;
  if (fontList.length > 0) payload.fonts = fontList;

  return payload;
}

function minimalPayload(payload: Record<string, unknown>, orgId: string) {
  return {
    org_id: orgId,
    brand_name: payload.brand_name ?? null,
    description: payload.description ?? null,
    logo_url: payload.logo_url ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function saveExtractedBrand(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  orgId: string,
  result: AutoDetectResult,
) {
  let payload = buildExtractedPayload(result, orgId);

  async function save(minimal = false) {
    if (minimal) payload = minimalPayload(payload, orgId);

    const { data: active, error: activeError } = await svc
      .from('brand_profile')
      .select('id' as never)
      .eq('org_id', orgId)
      .eq('is_active' as never, true as never)
      .maybeSingle();

    if (activeError && activeError.message.includes('column')) {
      return svc.from('brand_profile').upsert(payload as never, { onConflict: 'org_id' });
    }
    if (activeError) return { error: activeError };

    const activeId = (active as { id?: string } | null)?.id;
    if (activeId) {
      return svc
        .from('brand_profile')
        .update(payload as never)
        .eq('id' as never, activeId as never)
        .eq('org_id', orgId);
    }

    const { data: existing, error: existingError } = await svc
      .from('brand_profile')
      .select('id' as never)
      .eq('org_id', orgId)
      .limit(1)
      .maybeSingle();

    if (existingError) return { error: existingError };

    const existingId = (existing as { id?: string } | null)?.id;
    if (existingId) {
      return svc
        .from('brand_profile')
        .update({ ...payload, is_active: true } as never)
        .eq('id' as never, existingId as never)
        .eq('org_id', orgId);
    }

    return svc
      .from('brand_profile')
      .insert({ ...payload, is_active: true } as never);
  }

  let { error } = await save();
  if (error?.message.includes('column')) {
    ({ error } = await save(true));
  }
  if (error) throw error;

  return payload;
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

    // Run extraction pipeline. Persistence is handled here because Brand OS now
    // supports multiple brands and cannot use a simple org_id upsert anymore.
    const result = await autoDetectBrand({
      supabase: svc,
      orgId,
      url: body.url,
      persist: false,
      downloadLogo: body.downloadLogo ?? true,
    });

    let profilePatch: Record<string, unknown> | null = null;
    if (body.persist ?? true) {
      profilePatch = await saveExtractedBrand(svc, orgId, result);
    }

    return NextResponse.json({
      brand: result.brand,
      extracted: result.extracted,
      profilePatch,
      persisted: Boolean(profilePatch),
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
