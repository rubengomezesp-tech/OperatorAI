import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

export async function GET() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { data: workflows } = await svc
    .from('workflows')
    .select('id, name, description, trigger_type, is_active, last_run_at, last_run_status, total_runs, total_successes, total_failures, created_at, updated_at')
    .eq('org_id', orgId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  return NextResponse.json({ workflows: workflows ?? [] });
}
