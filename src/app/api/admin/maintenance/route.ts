import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';
import { logAudit } from '@/lib/admin/audit';
import { invalidateMaintenanceCache } from '@/lib/admin/maintenance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function checkAdmin() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) return null;
  return user;
}

export async function GET() {
  const u = await checkAdmin();
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const svc = createSupabaseServiceClient();
  const { data } = await (svc as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { maintenance_mode: boolean | null; maintenance_message: string | null; announcement: string | null; announcement_active: boolean | null; extra: Record<string, unknown> } | null }> } } } })
    .from('app_settings')
    .select('maintenance_mode, maintenance_message, announcement, announcement_active, extra')
    .eq('id', 'global')
    .maybeSingle();

  const extra = data?.extra ?? {};
  return NextResponse.json({
    maintenanceMode: data?.maintenance_mode ?? false,
    maintenanceMessage: data?.maintenance_message ?? '',
    announcement: data?.announcement ?? '',
    announcementActive: data?.announcement_active ?? false,
    chatDisabled: (extra as { chat_disabled?: boolean }).chat_disabled ?? false,
    adsDisabled: (extra as { ads_disabled?: boolean }).ads_disabled ?? false,
  });
}

export async function POST(req: NextRequest) {
  const u = await checkAdmin();
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const svc = createSupabaseServiceClient();
  const { data: current } = await (svc as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { extra?: Record<string, unknown> } | null }> } } } })
    .from('app_settings')
    .select('extra')
    .eq('id', 'global')
    .maybeSingle();

  const currentExtra = current?.extra ?? {};
  const newExtra = {
    ...currentExtra,
    chat_disabled: body.chatDisabled ?? currentExtra.chat_disabled ?? false,
    ads_disabled: body.adsDisabled ?? currentExtra.ads_disabled ?? false,
  };

  const update: Record<string, unknown> = {
    id: 'global',
    extra: newExtra,
    updated_at: new Date().toISOString(),
  };

  if (typeof body.maintenanceMode === 'boolean') update.maintenance_mode = body.maintenanceMode;
  if (typeof body.maintenanceMessage === 'string') update.maintenance_message = body.maintenanceMessage;
  if (typeof body.announcement === 'string') update.announcement = body.announcement;
  if (typeof body.announcementActive === 'boolean') update.announcement_active = body.announcementActive;

  const { error } = await (svc as unknown as { from: (t: string) => { upsert: (data: object, opts: object) => Promise<{ error: { message: string } | null }> } })
    .from('app_settings')
    .upsert(update, { onConflict: 'id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateMaintenanceCache();

  await logAudit({
    adminId: u.id,
    adminEmail: u.email ?? '',
    action: 'maintenance.update',
    entityType: 'app_settings',
    entityId: 'global',
    details: body as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true });
}
