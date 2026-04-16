-- Add agent_type to conversations for per-conversation agent selection
alter table public.conversations
  add column if not exists agent_type text
    check (agent_type in ('creative', 'brand', 'copy', 'research', 'analyst', 'social'));

-- Public conversation shares
create table if not exists public.conversation_shares (
  id text primary key default public.gen_cuid2(),
  slug text unique not null default encode(gen_random_bytes(8), 'hex'),
  conversation_id text not null references public.conversations(id) on delete cascade,
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'link' check (visibility in ('private', 'link', 'public')),
  title text,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversation_shares_slug_idx
  on public.conversation_shares (slug)
  where revoked_at is null;

create index if not exists conversation_shares_conv_idx
  on public.conversation_shares (conversation_id);

create index if not exists conversation_shares_user_idx
  on public.conversation_shares (user_id, created_at desc);

alter table public.conversation_shares enable row level security;

-- Owner can do anything
drop policy if exists "shares own rows" on public.conversation_shares;
create policy "shares own rows"
  on public.conversation_shares for all
  using (auth.uid() = user_id);

-- Service role bypasses RLS; public reads happen via service client in API
-- (prevents exposing private shares accidentally)

notify pgrst, 'reload schema';
