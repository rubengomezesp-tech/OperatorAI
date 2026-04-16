-- ============================================================
-- WORKFLOWS — visual automation (Zapier light)
-- ============================================================
create table if not exists public.workflows (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null,
  trigger_config jsonb not null default '{}'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  last_run_at timestamptz,
  last_run_status text,
  total_runs integer not null default 0,
  total_successes integer not null default 0,
  total_failures integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists workflows_org_idx
  on public.workflows (org_id, created_at desc)
  where archived_at is null;

create index if not exists workflows_active_idx
  on public.workflows (is_active, trigger_type)
  where is_active = true and archived_at is null;

alter table public.workflows enable row level security;

drop policy if exists "workflows by org" on public.workflows;
create policy "workflows by org"
  on public.workflows for all
  using (public.is_org_member(org_id));

-- Workflow runs (history)
create table if not exists public.workflow_runs (
  id text primary key default public.gen_cuid2(),
  workflow_id text not null references public.workflows(id) on delete cascade,
  org_id text not null references public.organizations(id) on delete cascade,
  status text not null,
  trigger_data jsonb default '{}'::jsonb,
  step_results jsonb default '[]'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists workflow_runs_workflow_idx
  on public.workflow_runs (workflow_id, started_at desc);

alter table public.workflow_runs enable row level security;

drop policy if exists "workflow_runs by org" on public.workflow_runs;
create policy "workflow_runs by org"
  on public.workflow_runs for all
  using (public.is_org_member(org_id));

-- ============================================================
-- ANALYSIS FILES — CSV/Excel for Code Interpreter
-- ============================================================
create table if not exists public.analysis_files (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_path text not null,
  row_count integer,
  column_count integer,
  columns jsonb,
  preview jsonb,
  last_analyzed_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists analysis_files_org_idx
  on public.analysis_files (org_id, created_at desc)
  where deleted_at is null;

alter table public.analysis_files enable row level security;

drop policy if exists "analysis_files by org" on public.analysis_files;
create policy "analysis_files by org"
  on public.analysis_files for all
  using (public.is_org_member(org_id));

-- Storage bucket for analysis files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('analysis', 'analysis', false, 52428800, ARRAY[
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'text/plain'
])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "analysis storage by org" on storage.objects;
create policy "analysis storage by org"
  on storage.objects for all
  using (
    bucket_id = 'analysis'
    and (storage.foldername(name))[1] in (
      select id::text from public.organizations where public.is_org_member(id)
    )
  );

-- ============================================================
-- Update plans entitlements with workflows
-- ============================================================
update public.plans set entitlements = entitlements || jsonb_build_object('workflows', 1) where id = 'starter';
update public.plans set entitlements = entitlements || jsonb_build_object('workflows', 10) where id = 'pro';
update public.plans set entitlements = entitlements || jsonb_build_object('workflows', 50) where id = 'studio';
update public.plans set entitlements = entitlements || jsonb_build_object('workflows', 999999) where id = 'agency';

-- Extend check_quota for workflows
create or replace function public.check_quota(
  p_org_id text,
  p_kind text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
  v_plan record;
  v_used bigint := 0;
  v_limit bigint := 0;
  v_period_start timestamptz;
begin
  select * into v_sub from public.subscriptions
  where org_id = p_org_id and status::text in ('trialing', 'active', 'past_due')
  order by created_at desc limit 1;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_subscription', 'used', 0, 'limit', 0);
  end if;

  if v_sub.plan_id is null then
    select * into v_plan from public.plans where id = 'pro' limit 1;
  else
    select * into v_plan from public.plans where id = v_sub.plan_id limit 1;
  end if;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_plan', 'used', 0, 'limit', 0);
  end if;

  v_period_start := coalesce(v_sub.current_period_start, date_trunc('month', now()));

  if p_kind = 'chat_message' then
    v_limit := coalesce((v_plan.entitlements->>'chat_messages')::bigint, 0);
    select coalesce(sum(quantity), 0) into v_used from public.usage_events
      where org_id = p_org_id and kind = 'chat_message' and created_at >= v_period_start;
  elsif p_kind = 'image_generation' then
    v_limit := coalesce((v_plan.entitlements->>'image_generations')::bigint, 0);
    select coalesce(sum(quantity), 0) into v_used from public.usage_events
      where org_id = p_org_id and kind = 'image_generation' and created_at >= v_period_start;
  elsif p_kind = 'video_generation' then
    v_limit := coalesce((v_plan.entitlements->>'video_generations')::bigint, 0);
    select count(*)::bigint into v_used from public.videos
      where org_id = p_org_id and deleted_at is null and created_at >= v_period_start
      and status in ('pending', 'processing', 'completed');
  elsif p_kind = 'knowledge_document' then
    v_limit := coalesce((v_plan.entitlements->>'knowledge_documents')::bigint, 0);
    select count(*)::bigint into v_used from public.documents
      where org_id = p_org_id and deleted_at is null;
  elsif p_kind = 'assistant' then
    v_limit := coalesce((v_plan.entitlements->>'assistants')::bigint, 0);
    select count(*)::bigint into v_used from public.assistants
      where org_id = p_org_id and deleted_at is null;
  elsif p_kind = 'project' then
    v_limit := coalesce((v_plan.entitlements->>'projects')::bigint, 0);
    select count(*)::bigint into v_used from public.projects
      where org_id = p_org_id and is_archived = false;
  elsif p_kind = 'integration' then
    v_limit := coalesce((v_plan.entitlements->>'integrations')::bigint, 0);
    select count(*)::bigint into v_used from public.integrations
      where org_id = p_org_id and status = 'connected';
  elsif p_kind = 'workflow' then
    v_limit := coalesce((v_plan.entitlements->>'workflows')::bigint, 0);
    select count(*)::bigint into v_used from public.workflows
      where org_id = p_org_id and archived_at is null;
  else
    return jsonb_build_object('allowed', false, 'reason', 'unknown_kind', 'used', 0, 'limit', 0);
  end if;

  return jsonb_build_object(
    'allowed', v_used < v_limit,
    'used', v_used, 'limit', v_limit,
    'plan_id', v_plan.id, 'status', v_sub.status::text,
    'trial_ends_at', v_sub.trial_end
  );
end;
$$;

grant execute on function public.check_quota(text, text) to authenticated, service_role;

notify pgrst, 'reload schema';
