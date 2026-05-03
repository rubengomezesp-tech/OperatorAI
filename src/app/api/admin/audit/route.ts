import 'server-only';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AuditRow {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export async function GET() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const svc = createSupabaseServiceClient();
  const { data } = await (svc as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        order: (k: string, opts: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: AuditRow[] | null }>;
        };
      };
    };
  })
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  return NextResponse.json({ entries: data ?? [] });
}
