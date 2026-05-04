import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '100'), 500);
  const severity = url.searchParams.get('severity') || undefined;
  const path = url.searchParams.get('path') || undefined;

  try {
    const svc = createSupabaseServiceClient();
    
    // Usar RPC o query genérico para evitar error de tipos
    let query = (svc as any).from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }
    if (path) {
      query = query.ilike('path', `%${path}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ 
          logs: [], total: 0,
          message: 'audit_log table not found.',
          sql: `CREATE TABLE IF NOT EXISTS public.audit_log (\n  id BIGSERIAL PRIMARY KEY,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  severity TEXT CHECK (severity IN ('error', 'warning', 'info')),\n  path TEXT,\n  message TEXT,\n  user_email TEXT,\n  ip TEXT,\n  metadata JSONB DEFAULT '{}'::jsonb\n);\n\nCREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);\nCREATE INDEX IF NOT EXISTS idx_audit_log_severity ON public.audit_log (severity);`
        });
      }
      throw error;
    }

    return NextResponse.json({ logs: data || [], total: data?.length ?? 0 });
  } catch (err) {
    console.error('[admin/logs] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch logs';
    return NextResponse.json({ error: message, logs: [], total: 0 }, { status: 500 });
  }
}
