-- ════════════════════════════════════════════════════════════════════════════
-- ADMIN_AUDIT_LOG: registro de acciones del admin
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  admin_email text not null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_admin_idx on public.admin_audit_log (admin_id);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_action_idx on public.admin_audit_log (action);
create index if not exists admin_audit_log_entity_idx on public.admin_audit_log (entity_type, entity_id);
