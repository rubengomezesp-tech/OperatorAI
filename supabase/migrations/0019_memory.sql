-- Memory table: facts about user/org that persist across conversations
create table if not exists public.memories (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  category text default 'general',
  importance integer not null default 3,
  source text default 'explicit',
  source_conversation_id text references public.conversations(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memories_org_user_idx
  on public.memories (org_id, user_id)
  where is_active = true;

create index if not exists memories_importance_idx
  on public.memories (org_id, importance desc, created_at desc)
  where is_active = true;

alter table public.memories enable row level security;

drop policy if exists "memories by owner" on public.memories;
create policy "memories by owner"
  on public.memories for all
  using (user_id = auth.uid() and public.is_org_member(org_id));

-- Voice fingerprint: learned style from conversations
create table if not exists public.voice_fingerprints (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tone_summary text,
  sentence_length text,
  vocabulary_style text,
  preferred_phrases text[],
  avoided_phrases text[],
  structural_preferences text,
  example_messages jsonb default '[]'::jsonb,
  sample_count integer not null default 0,
  last_analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists voice_fingerprints_user_unique
  on public.voice_fingerprints (org_id, user_id);

alter table public.voice_fingerprints enable row level security;

drop policy if exists "fingerprints by owner" on public.voice_fingerprints;
create policy "fingerprints by owner"
  on public.voice_fingerprints for all
  using (user_id = auth.uid() and public.is_org_member(org_id));

notify pgrst, 'reload schema';
