-- ============================================================
-- INTEGRATIONS (Composio-backed)
-- ============================================================
create table if not exists public.integrations (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  composio_connection_id text,
  composio_entity_id text,
  status text not null default 'pending',
  scopes text[],
  metadata jsonb default '{}'::jsonb,
  connected_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists integrations_user_provider_unique
  on public.integrations (org_id, user_id, provider)
  where status in ('connected', 'pending');

create index if not exists integrations_org_idx
  on public.integrations (org_id)
  where status = 'connected';

alter table public.integrations enable row level security;

drop policy if exists "integrations by owner" on public.integrations;
create policy "integrations by owner"
  on public.integrations for all
  using (user_id = auth.uid() and public.is_org_member(org_id));

-- ============================================================
-- PROJECTS (workspaces per brand/client)
-- ============================================================
create table if not exists public.projects (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text default '#C9A863',
  icon text default 'folder',
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_org_idx
  on public.projects (org_id, sort_order)
  where is_archived = false;

alter table public.projects enable row level security;

drop policy if exists "projects by org members" on public.projects;
create policy "projects by org members"
  on public.projects for all
  using (public.is_org_member(org_id));

-- Add project_id to conversations
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='conversations' and column_name='project_id') then
    alter table public.conversations add column project_id text references public.projects(id) on delete set null;
    create index if not exists conversations_project_idx on public.conversations(project_id) where project_id is not null;
  end if;
end$$;

-- Add project_id to documents (Knowledge can be project-scoped)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='documents' and column_name='project_id') then
    alter table public.documents add column project_id text references public.projects(id) on delete set null;
    create index if not exists documents_project_idx on public.documents(project_id) where project_id is not null;
  end if;
end$$;

-- ============================================================
-- AGENT TYPE on conversations (which specialized agent was used)
-- ============================================================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='conversations' and column_name='agent_type') then
    alter table public.conversations add column agent_type text default 'creative';
  end if;
end$$;

-- ============================================================
-- AGENCY PLAN ($999 tier) + retire old agency to enterprise label
-- ============================================================
update public.plans
set entitlements = jsonb_build_object(
  'chat_messages', 50000,
  'image_generations', 5000,
  'knowledge_documents', 999999,
  'assistants', 999999,
  'projects', 999999,
  'integrations', 999999,
  'team_seats', 25,
  'white_label', true,
  'priority_support', true,
  'features', coalesce(entitlements->'features', '{}'::jsonb)
)
where id = 'agency';

insert into public.plans (
  id, name, description,
  price_monthly_usd, price_yearly_usd,
  entitlements, sort_order, is_public, is_default
) values (
  'studio', 'Studio', 'For studios managing multiple brands',
  299, 2990,
  jsonb_build_object(
    'chat_messages', 15000,
    'image_generations', 1500,
    'knowledge_documents', 999999,
    'assistants', 999999,
    'projects', 25,
    'integrations', 50,
    'team_seats', 5,
    'features', '{}'::jsonb
  ),
  3, true, false
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_monthly_usd = excluded.price_monthly_usd,
  price_yearly_usd = excluded.price_yearly_usd,
  entitlements = excluded.entitlements,
  sort_order = excluded.sort_order,
  is_public = true,
  updated_at = now();

-- Bump agency to slot 4
update public.plans set sort_order = 4 where id = 'agency';

-- ============================================================
-- check_quota — extend for projects + integrations
-- ============================================================
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
