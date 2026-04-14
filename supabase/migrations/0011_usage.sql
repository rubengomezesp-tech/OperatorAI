create type usage_kind as enum (
  'chat_message',
  'image_generation',
  'voice_stt_seconds',
  'voice_tts_seconds',
  'document_ingested',
  'document_storage_bytes',
  'embedding_tokens'
);

create table public.usage_events (
  id              bigserial primary key,
  org_id          text not null references public.organizations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  assistant_id    text references public.assistants(id) on delete set null,
  kind            usage_kind not null,
  quantity        bigint not null,
  cost_usd        numeric(10,6) default 0,
  source_id       text,
  source_table    text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index usage_events_org_kind_created_idx
  on public.usage_events (org_id, kind, created_at desc);
create index usage_events_created_idx on public.usage_events (created_at);

create table public.usage_periods (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  period_start    timestamptz not null,
  period_end      timestamptz not null,
  chat_messages          bigint not null default 0,
  image_generations      bigint not null default 0,
  voice_stt_seconds      bigint not null default 0,
  voice_tts_seconds      bigint not null default 0,
  documents_ingested     bigint not null default 0,
  document_storage_bytes bigint not null default 0,
  embedding_tokens       bigint not null default 0,
  total_cost_usd  numeric(12,4) not null default 0,
  last_updated_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (org_id, period_start)
);
create index usage_periods_org_period_idx on public.usage_periods (org_id, period_start desc);

create or replace function increment_usage(
  p_org_id text,
  p_kind usage_kind,
  p_quantity bigint,
  p_cost numeric default 0
) returns void as $$
declare
  v_period_start timestamptz := date_trunc('month', now());
  v_period_end   timestamptz := v_period_start + interval '1 month';
begin
  insert into public.usage_periods (org_id, period_start, period_end)
  values (p_org_id, v_period_start, v_period_end)
  on conflict (org_id, period_start) do nothing;

  update public.usage_periods
  set
    chat_messages          = case when p_kind = 'chat_message' then chat_messages + p_quantity else chat_messages end,
    image_generations      = case when p_kind = 'image_generation' then image_generations + p_quantity else image_generations end,
    voice_stt_seconds      = case when p_kind = 'voice_stt_seconds' then voice_stt_seconds + p_quantity else voice_stt_seconds end,
    voice_tts_seconds      = case when p_kind = 'voice_tts_seconds' then voice_tts_seconds + p_quantity else voice_tts_seconds end,
    documents_ingested     = case when p_kind = 'document_ingested' then documents_ingested + p_quantity else documents_ingested end,
    document_storage_bytes = case when p_kind = 'document_storage_bytes' then document_storage_bytes + p_quantity else document_storage_bytes end,
    embedding_tokens       = case when p_kind = 'embedding_tokens' then embedding_tokens + p_quantity else embedding_tokens end,
    total_cost_usd         = total_cost_usd + p_cost,
    last_updated_at        = now()
  where org_id = p_org_id and period_start = v_period_start;
end;
$$ language plpgsql security definer;
