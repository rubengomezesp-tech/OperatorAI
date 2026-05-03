import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';
import { DEFAULT_HOME_CONTENT, type HomeContent } from '@/lib/home-content/defaults';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function checkAdmin() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) return null;
  return user;
}

export async function GET() {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const svc = createSupabaseServiceClient();
  const { data } = await (svc as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { extra?: { home?: Partial<HomeContent> } } | null }> } } } })
    .from('app_settings')
    .select('extra')
    .eq('id', 'global')
    .maybeSingle();

  const extra = data?.extra ?? {};
  const overrides = extra.home ?? {};
  const merged = { ...DEFAULT_HOME_CONTENT, ...overrides } as HomeContent;

  return NextResponse.json({
    content: merged,
    hasOverrides: Object.keys(overrides).length > 0,
  });
}

export async function POST(req: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const newContent = body.content as Partial<HomeContent>;

  const svc = createSupabaseServiceClient();

  // Get current extra
  const { data: current } = await (svc as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { extra?: Record<string, unknown> } | null }> } } } })
    .from('app_settings')
    .select('extra')
    .eq('id', 'global')
    .maybeSingle();

  const currentExtra = current?.extra ?? {};
  const newExtra = { ...currentExtra, home: newContent };

  const { error } = await (svc as unknown as { from: (t: string) => { upsert: (data: object, opts: object) => Promise<{ error: { message: string } | null }> } })
    .from('app_settings')
    .upsert({
      id: 'global',
      extra: newExtra,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  // Reset to defaults (remove the home key from extra)
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const svc = createSupabaseServiceClient();
  const { data: current } = await (svc as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { extra?: Record<string, unknown> } | null }> } } } })
    .from('app_settings')
    .select('extra')
    .eq('id', 'global')
    .maybeSingle();

  const currentExtra = current?.extra ?? {};
  delete currentExtra.home;

  const { error } = await (svc as unknown as { from: (t: string) => { upsert: (data: object, opts: object) => Promise<{ error: { message: string } | null }> } })
    .from('app_settings')
    .upsert({
      id: 'global',
      extra: currentExtra,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
