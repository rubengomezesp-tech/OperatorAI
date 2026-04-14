create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           citext not null unique,
  full_name       text,
  avatar_url      text,
  locale          text not null default 'en',
  timezone        text not null default 'UTC',
  marketing_opt_in boolean not null default false,
  last_seen_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index users_email_idx on public.users (email);
create trigger users_updated_at before update on public.users
  for each row execute function tg_set_updated_at();

create or replace function handle_new_auth_user() returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, locale)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.raw_user_meta_data->>'locale', 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

create table public.organizations (
  id              text primary key default gen_cuid2(),
  slug            citext not null unique,
  name            text not null,
  logo_url        text,
  website         text,
  industry        text,
  size            text,
  country         text,
  locale_default  text not null default 'en',
  timezone        text not null default 'UTC',
  brand_primary   text default '#0b0b0c',
  brand_accent    text default '#c9a863',
  custom_domain   text unique,
  owner_user_id   uuid not null references public.users(id),
  onboarding_status text not null default 'pending'
    check (onboarding_status in ('pending', 'in_progress', 'complete')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index organizations_owner_idx on public.organizations (owner_user_id);
create index organizations_slug_idx on public.organizations (slug) where deleted_at is null;
create trigger organizations_updated_at before update on public.organizations
  for each row execute function tg_set_updated_at();

create type membership_role as enum ('owner', 'admin', 'member', 'viewer');
create type membership_status as enum ('pending', 'active', 'suspended');

create table public.memberships (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  role            membership_role not null default 'member',
  status          membership_status not null default 'active',
  invited_by      uuid references public.users(id),
  invited_at      timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id) where status = 'active';
create index memberships_org_idx on public.memberships (org_id) where status = 'active';
create trigger memberships_updated_at before update on public.memberships
  for each row execute function tg_set_updated_at();

create table public.invitations (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  email           citext not null,
  role            membership_role not null default 'member',
  token           text not null unique,
  invited_by      uuid not null references public.users(id),
  expires_at      timestamptz not null,
  accepted_at     timestamptz,
  accepted_by     uuid references public.users(id),
  created_at      timestamptz not null default now()
);
create unique index invitations_pending_unique
  on public.invitations (org_id, email) where accepted_at is null;
create index invitations_token_idx on public.invitations (token);
create index invitations_email_idx on public.invitations (email) where accepted_at is null;
