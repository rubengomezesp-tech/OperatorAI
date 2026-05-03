import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export interface AuditEntry {
  adminId: string;
  adminEmail: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const svc = createSupabaseServiceClient();
    await (svc as unknown as { from: (t: string) => { insert: (data: object) => Promise<unknown> } })
      .from('admin_audit_log')
      .insert({
        admin_id: entry.adminId,
        admin_email: entry.adminEmail,
        action: entry.action,
        entity_type: entry.entityType ?? null,
        entity_id: entry.entityId ?? null,
        details: entry.details ?? {},
        ip: entry.ip ?? null,
        created_at: new Date().toISOString(),
      });
  } catch (err) {
    console.error('[audit] failed to log', err);
  }
}
