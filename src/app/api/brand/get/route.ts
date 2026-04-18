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
    const { data } = await svc.from('brand_profile').select('*').eq('org_id', orgId).maybeSingle();

    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ profile: null });
  }
}
