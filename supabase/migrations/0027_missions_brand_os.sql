-- Missions — autonomous multi-step objectives
create table if not exists public.missions (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  objective text not null,
  category text check (category in ('content', 'campaign', 'research', 'operations', 'growth')),
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed', 'failed')),
  autonomy_level text not null default 'review' check (autonomy_level in ('review', 'auto', 'scheduled')),
  progress integer not null default 0,
  budget_cents integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  due_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists missions_org_idx
  on public.missions (org_id, status, created_at desc);

alter table public.missions enable row level security;

drop policy if exists "missions by org members" on public.missions;
create policy "missions by org members"
  on public.missions for all
  using (public.is_org_member(org_id));

-- Mission steps — orchestration log
create table if not exists public.mission_steps (
  id text primary key default public.gen_cuid2(),
  mission_id text not null references public.missions(id) on delete cascade,
  step_order integer not null,
  agent_type text,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'skipped')),
  output jsonb default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mission_steps_mission_idx
  on public.mission_steps (mission_id, step_order);

alter table public.mission_steps enable row level security;

drop policy if exists "mission_steps by org via parent" on public.mission_steps;
create policy "mission_steps by org via parent"
  on public.mission_steps for all
  using (exists (
    select 1 from public.missions m
    where m.id = mission_steps.mission_id
      and public.is_org_member(m.org_id)
  ));

-- Brand OS rules — rules for brand-locked validation
create table if not exists public.brand_os_rules (
  org_id text primary key references public.organizations(id) on delete cascade,
  brand_colors jsonb default '[]'::jsonb,
  typography jsonb default '{}'::jsonb,
  tone text check (tone in ('minimal', 'editorial', 'bold', 'playful', 'professional')),
  always_use_words text[] default array[]::text[],
  never_use_words text[] default array[]::text[],
  sample_outputs jsonb default '[]'::jsonb,
  logo_url text,
  validator_strictness text default 'medium' check (validator_strictness in ('low', 'medium', 'high', 'strict')),
  auto_correct boolean default true,
  updated_at timestamptz not null default now()
);

alter table public.brand_os_rules enable row level security;

drop policy if exists "brand_os_rules by org members" on public.brand_os_rules;
create policy "brand_os_rules by org members"
  on public.brand_os_rules for all
  using (public.is_org_member(org_id));

-- Brand OS validations — audit log of output checks
create table if not exists public.brand_os_validations (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  content_type text not null check (content_type in ('text', 'image', 'video')),
  content_hash text,
  passed boolean not null,
  violations jsonb default '[]'::jsonb,
  auto_corrected boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists brand_os_validations_org_idx
  on public.brand_os_validations (org_id, created_at desc);

alter table public.brand_os_validations enable row level security;

drop policy if exists "brand_os_validations by org members" on public.brand_os_validations;
create policy "brand_os_validations by org members"
  on public.brand_os_validations for all
  using (public.is_org_member(org_id));

notify pgrst, 'reload schema';
