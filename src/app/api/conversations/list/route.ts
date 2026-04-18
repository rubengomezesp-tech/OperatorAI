import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ conversations: [] });

    const svc = createSupabaseServiceClient();
    const { orgId } = await resolveOrgContext(svc, user.id);

    const { data } = await svc
      .from('conversations')
      .select('id, title, updated_at')
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(100);

    return NextResponse.json({ conversations: data ?? [] });
  } catch {
    return NextResponse.json({ conversations: [] });
  }
}
