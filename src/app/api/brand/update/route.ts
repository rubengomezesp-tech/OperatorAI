import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    const { orgId } = await resolveOrgContext(svc, user.id);

    const { error } = await svc.from('brand_profile').upsert({
      org_id: orgId,
      brand_name: body.brand_name ?? null,
      description: body.description ?? null,
      vibe: body.vibe ?? null,
      colors: body.colors ?? [],
      fonts: body.fonts ?? [],
      target_audience: body.target_audience ?? null,
      tone_keywords: body.tone_keywords ?? [],
      visual_style: body.visual_style ?? null,
      industry: body.industry ?? null,
      content_pillars: body.content_pillars ?? [],
      avoid_keywords: body.avoid_keywords ?? [],
      instagram_handle: body.instagram_handle ?? null,
      brand_values: body.brand_values ?? [],
      competitors: body.competitors ?? [],
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'org_id' });

    if (error) {
      // If column doesn't exist yet, retry without it
      console.error('[brand] save error:', error.message);
      if (error.message.includes('column')) {
        const { error: e2 } = await svc.from('brand_profile').upsert({
          org_id: orgId,
          brand_name: body.brand_name ?? null,
          description: body.description ?? null,
          vibe: body.vibe ?? null,
          updated_at: new Date().toISOString(),
        } as never, { onConflict: 'org_id' });
        if (e2) throw e2;
      } else {
        throw error;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
