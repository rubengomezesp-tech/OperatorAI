create table public.prompt_versions (
  id              text primary key default gen_cuid2(),
  slug            text not null,
  version         int not null,
  content         text not null,
  description     text,
  is_active       boolean not null default false,
  is_canary       boolean not null default false,
  canary_weight   int default 0 check (canary_weight between 0 and 100),
  created_by      uuid references public.users(id),
  created_at      timestamptz not null default now(),
  promoted_at     timestamptz,
  unique (slug, version)
);
create index prompt_versions_slug_active_idx on public.prompt_versions (slug)
  where is_active = true;
