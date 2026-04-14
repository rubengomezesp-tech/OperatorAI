create table public.conversations (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  assistant_id    text not null references public.assistants(id) on delete restrict,
  user_id         uuid not null references public.users(id) on delete cascade,
  title           text,
  summary         text,
  locale          text,
  is_archived     boolean not null default false,
  is_starred      boolean not null default false,
  message_count   int not null default 0,
  token_count     int not null default 0,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index conversations_org_user_idx on public.conversations (org_id, user_id, last_message_at desc)
  where deleted_at is null;
create index conversations_assistant_idx on public.conversations (assistant_id, last_message_at desc)
  where deleted_at is null;
create index conversations_starred_idx on public.conversations (org_id, user_id)
  where is_starred = true and deleted_at is null;
create trigger conversations_updated_at before update on public.conversations
  for each row execute function tg_set_updated_at();

create type message_role as enum ('user', 'assistant', 'system', 'tool');
create type message_status as enum ('pending', 'streaming', 'complete', 'failed');

create table public.messages (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  conversation_id text not null references public.conversations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  role            message_role not null,
  content         text,
  content_parts   jsonb,
  attachment_ids  text[],
  model           text,
  provider        text,
  prompt_version_id text references public.prompt_versions(id),
  tool_calls      jsonb,
  tool_results    jsonb,
  input_tokens    int,
  output_tokens   int,
  latency_ms      int,
  cost_usd        numeric(10,6),
  status          message_status not null default 'complete',
  error_code      text,
  error_message   text,
  context_doc_chunks text[],
  context_memories   text[],
  voice_request_id text,
  parent_message_id text references public.messages(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index messages_conv_created_idx on public.messages (conversation_id, created_at);
create index messages_org_created_idx on public.messages (org_id, created_at desc);
create index messages_parent_idx on public.messages (parent_message_id)
  where parent_message_id is not null;
create index messages_content_fts_idx on public.messages
  using gin (to_tsvector('simple', coalesce(content, '')));
create trigger messages_updated_at before update on public.messages
  for each row execute function tg_set_updated_at();

create or replace function tg_bump_conversation() returns trigger as $$
begin
  update public.conversations
  set message_count = message_count + 1,
      token_count = token_count + coalesce(new.input_tokens, 0) + coalesce(new.output_tokens, 0),
      last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

create trigger messages_bump_conv after insert on public.messages
  for each row execute function tg_bump_conversation();
