import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

function normalizeOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeVibe(value: unknown): string | null {
  const vibe = normalizeOptionalString(value)?.toLowerCase() ?? null;
  return vibe && ['minimal', 'editorial', 'bold', 'playful'].includes(vibe) ? vibe : null;
}

function buildBrandPayload(body: Record<string, unknown>, orgId: string, minimal = false) {
  const base = {
    org_id: orgId,
    brand_name: normalizeOptionalString(body.brand_name),
    description: normalizeOptionalString(body.description),
    vibe: normalizeVibe(body.vibe),
    updated_at: new Date().toISOString(),
  };

  if (minimal) return base;

  return {
    ...base,
    logo_url: normalizeOptionalString(body.logo_url) ?? normalizeOptionalString(body.detected_logo_url),
    colors: Array.isArray(body.colors) ? body.colors : [],
    fonts: Array.isArray(body.fonts) ? body.fonts : [],
    target_audience: normalizeOptionalString(body.target_audience),
    tone_keywords: Array.isArray(body.tone_keywords) ? body.tone_keywords : [],
    visual_style: normalizeOptionalString(body.visual_style),
    industry: normalizeOptionalString(body.industry),
    content_pillars: Array.isArray(body.content_pillars) ? body.content_pillars : [],
    avoid_keywords: Array.isArray(body.avoid_keywords) ? body.avoid_keywords : [],
    instagram_handle: normalizeOptionalString(body.instagram_handle),
    brand_values: Array.isArray(body.brand_values) ? body.brand_values : [],
    competitors: Array.isArray(body.competitors) ? body.competitors : [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    const { orgId } = await resolveOrgContext(svc, user.id);

    let payload = buildBrandPayload(body, orgId);

    async function saveCurrentBrand(minimal = false) {
      if (minimal) payload = buildBrandPayload(body, orgId, true);

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

    let { error } = await saveCurrentBrand();

    if (error?.message.includes('column')) {
      console.error('[brand] save retrying with minimal payload:', error.message);
      ({ error } = await saveCurrentBrand(true));
    } else if (error) {
      console.error('[brand] save error:', error.message);
    }

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : JSON.stringify(e) }, { status: 500 });
  }
}
