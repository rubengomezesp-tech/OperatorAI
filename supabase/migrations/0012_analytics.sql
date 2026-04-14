create table public.analytics_events (
  id              bigserial primary key,
  org_id          text references public.organizations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  name            text not null,
  properties      jsonb not null default '{}'::jsonb,
  session_id      text,
  request_id      text,
  user_agent      text,
  ip_hash         text,
  created_at      timestamptz not null default now()
);
create index analytics_org_name_idx on public.analytics_events (org_id, name, created_at desc);
create index analytics_created_idx on public.analytics_events (created_at);
