create type memory_scope as enum ('user', 'organization', 'assistant');
create type memory_source as enum ('explicit', 'extracted', 'imported');

create table public.memory_entries (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  scope           memory_scope not null,
  user_id         uuid references public.users(id) on delete cascade,
  assistant_id    text references public.assistants(id) on delete cascade,
  category        text not null,
  content         text not null,
  context         text,
  confidence      numeric(3,2) default 0.80 check (confidence between 0.00 and 1.00),
  source          memory_source not null default 'extracted',
  source_conversation_id text references public.conversations(id) on delete set null,
  source_message_id text references public.messages(id) on delete set null,
  embedding       vector(1536),
  last_used_at    timestamptz,
  use_count       int not null default 0,
  is_pinned       boolean not null default false,
  is_hidden       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (
    (scope = 'user' and user_id is not null)
    or (scope = 'organization' and user_id is null)
    or (scope = 'assistant' and assistant_id is not null)
  )
);
create index memory_org_scope_idx on public.memory_entries (org_id, scope);
create index memory_user_idx on public.memory_entries (user_id) where user_id is not null;
create index memory_embedding_hnsw_idx on public.memory_entries
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
create trigger memory_updated_at before update on public.memory_entries
  for each row execute function tg_set_updated_at();

create or replace function match_memories(
  p_org_id text,
  p_user_id uuid,
  p_assistant_id text,
  p_query_embedding vector,
  p_match_count int default 6
) returns table (id text, content text, similarity float) as $$
  select id, content,
         1 - (embedding <=> p_query_embedding) as similarity
  from public.memory_entries
  where org_id = p_org_id
    and is_hidden = false
    and (
      (scope = 'organization')
      or (scope = 'user' and user_id = p_user_id)
      or (scope = 'assistant' and assistant_id = p_assistant_id)
    )
  order by embedding <=> p_query_embedding
  limit p_match_count;
$$ language sql stable;
