-- ═══════════════════════════════════════════════════════════════
-- 🎨 MULTI-BRAND SUPPORT — Sprint Day 6
-- ═══════════════════════════════════════════════════════════════
-- Convierte brand_profile de "1 brand x org" a "many brands x org"
-- preservando toda la data existente.
--
-- Strategy:
--   1. Add 'id' UUID column (default gen_random_uuid())
--   2. Add 'is_active' boolean (default true)
--   3. Backfill ids para rows existentes
--   4. Drop old primary key (org_id)
--   5. New primary key: id
--   6. Unique constraint: solo 1 active per org
--
-- Backward compat:
--   - org_id sigue siendo foreign key (just no más PK)
--   - Existing /api/brand/get queries siguen funcionando si filtran por is_active
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add new columns ──
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brand_profile' and column_name = 'id'
  ) then
    alter table public.brand_profile
      add column id uuid default gen_random_uuid();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brand_profile' and column_name = 'is_active'
  ) then
    alter table public.brand_profile
      add column is_active boolean not null default true;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brand_profile' and column_name = 'created_at'
  ) then
    alter table public.brand_profile
      add column created_at timestamptz not null default now();
  end if;
end $$;

-- ── 2. Backfill ids para rows que aún no tienen ──
update public.brand_profile
set id = gen_random_uuid()
where id is null;

-- ── 3. Make id NOT NULL ──
alter table public.brand_profile
  alter column id set not null;

-- ── 4. Drop old primary key ──
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
    and table_name = 'brand_profile'
    and constraint_type = 'PRIMARY KEY'
  ) then
    -- Drop existing PK (whatever its name)
    execute (
      select 'alter table public.brand_profile drop constraint ' || constraint_name
      from information_schema.table_constraints
      where table_schema = 'public'
      and table_name = 'brand_profile'
      and constraint_type = 'PRIMARY KEY'
      limit 1
    );
  end if;
end $$;

-- ── 5. New primary key on id ──
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
    and table_name = 'brand_profile'
    and constraint_type = 'PRIMARY KEY'
  ) then
    alter table public.brand_profile add primary key (id);
  end if;
end $$;

-- ── 6. Index on org_id (still queried frequently) ──
create index if not exists brand_profile_org_idx
  on public.brand_profile (org_id);

-- ── 7. UNIQUE constraint: solo 1 active brand per org ──
-- Drop old if exists, recreate
drop index if exists brand_profile_one_active_per_org;
create unique index brand_profile_one_active_per_org
  on public.brand_profile (org_id)
  where is_active = true;

-- ── 8. Update RLS policy (sigue siendo by org_id member) ──
drop policy if exists "brand_profile by org members" on public.brand_profile;
create policy "brand_profile by org members"
  on public.brand_profile for all
  using (public.is_org_member(org_id));

-- ── VERIFICATION ──
-- After running, this should show all existing rows have id + is_active=true
--
--   select org_id, id, brand_name, is_active from public.brand_profile order by created_at;
