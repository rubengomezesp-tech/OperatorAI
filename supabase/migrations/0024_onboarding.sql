-- Brand profile — per organization
create table if not exists public.brand_profile (
  org_id text primary key references public.organizations(id) on delete cascade,
  brand_name text,
  description text,
  vibe text check (vibe in ('minimal', 'editorial', 'bold', 'playful')),
  logo_url text,
  user_role text,
  first_prompt text,
  updated_at timestamptz not null default now()
);

alter table public.brand_profile enable row level security;

drop policy if exists "brand_profile by org members" on public.brand_profile;
create policy "brand_profile by org members"
  on public.brand_profile for all
  using (public.is_org_member(org_id));

-- Onboarding state — per user
create table if not exists public.onboarding_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id text references public.organizations(id) on delete cascade,
  current_step integer default 0,
  completed boolean default false,
  data jsonb default '{}'::jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz
);

alter table public.onboarding_state enable row level security;

drop policy if exists "onboarding own rows" on public.onboarding_state;
create policy "onboarding own rows"
  on public.onboarding_state for all
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
