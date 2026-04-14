create type document_status as enum ('uploading', 'processing', 'ready', 'failed');

create table public.documents (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  uploaded_by     uuid references public.users(id) on delete set null,
  storage_bucket  text not null default 'knowledge',
  storage_path    text not null,
  original_name   text not null,
  mime_type       text not null,
  size_bytes      bigint not null,
  checksum_sha256 text,
  status          document_status not null default 'uploading',
  extracted_text_preview text,
  chunk_count     int not null default 0,
  processing_error text,
  processed_at    timestamptz,
  assistant_scope text[],
  tags            text[] default array[]::text[],
  title           text,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index documents_org_status_idx on public.documents (org_id, status) where deleted_at is null;
create index documents_checksum_idx on public.documents (org_id, checksum_sha256);
create index documents_tags_idx on public.documents using gin (tags);
create trigger documents_updated_at before update on public.documents
  for each row execute function tg_set_updated_at();

create table public.document_chunks (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  document_id     text not null references public.documents(id) on delete cascade,
  chunk_index     int not null,
  content         text not null,
  content_hash    text not null,
  token_count     int not null,
  page_number     int,
  section_heading text,
  embedding       vector(1536),
  tsv             tsvector generated always as (to_tsvector('simple', content)) stored,
  created_at      timestamptz not null default now(),
  unique (document_id, chunk_index)
);
create index chunks_embedding_hnsw_idx on public.document_chunks
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
create index chunks_org_idx on public.document_chunks (org_id);
create index chunks_document_idx on public.document_chunks (document_id);
create index chunks_tsv_idx on public.document_chunks using gin (tsv);

create or replace function match_chunks(
  p_org_id text,
  p_assistant_id text,
  p_query_embedding vector,
  p_match_count int default 8,
  p_min_similarity float default 0.7
) returns table (
  id text, document_id text, content text, source text, similarity float
) as $$
  select
    c.id, c.document_id, c.content,
    coalesce(d.title, d.original_name) as source,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where c.org_id = p_org_id
    and d.deleted_at is null
    and d.status = 'ready'
    and (p_assistant_id is null
         or d.assistant_scope is null
         or p_assistant_id = any(d.assistant_scope))
    and 1 - (c.embedding <=> p_query_embedding) >= p_min_similarity
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$ language sql stable;
