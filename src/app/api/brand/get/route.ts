import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ profile: null });

    const svc = createSupabaseServiceClient();
    const { orgId } = await resolveOrgContext(svc, user.id);
    let { data, error } = await svc
      .from('brand_profile')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active' as never, true as never)
      .maybeSingle();

    if (error?.message.includes('column')) {
      const fallback = await svc.from('brand_profile').select('*').eq('org_id', orgId).maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ profile: null });
  }
}
