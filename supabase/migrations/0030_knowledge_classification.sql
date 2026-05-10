-- ═══════════════════════════════════════════════════════════════
-- 📚 KNOWLEDGE CLASSIFICATION — Sprint 6 Phase 2
-- ═══════════════════════════════════════════════════════════════
-- Adds classification system to documents:
--   • category: 'brand' | 'business' | 'customers' | 'content' | 'other'
--   • subcategory: free-text refinement (e.g. 'logo', 'brand-book', 'pitch-deck')
--   • is_brand_asset: boolean (boost retrieval para brand context)
--   • importance: 1-5 (RAG retrieval ranking)
--
-- Backwards compatible: existing rows default to 'other'.
-- ═══════════════════════════════════════════════════════════════

-- 1) Add columns
alter table public.documents
  add column if not exists category text not null default 'other'
    check (category in ('brand', 'business', 'customers', 'content', 'other'));

alter table public.documents
  add column if not exists subcategory text;

alter table public.documents
  add column if not exists is_brand_asset boolean not null default false;

alter table public.documents
  add column if not exists importance smallint not null default 3
    check (importance between 1 and 5);

-- 2) Indexes for filtered queries
create index if not exists documents_org_category_idx
  on public.documents (org_id, category)
  where deleted_at is null;

create index if not exists documents_org_brand_asset_idx
  on public.documents (org_id, is_brand_asset)
  where deleted_at is null and is_brand_asset = true;

create index if not exists documents_org_importance_idx
  on public.documents (org_id, importance desc)
  where deleted_at is null;

-- 3) Comment for clarity
comment on column public.documents.category is
  'High-level classification: brand (logos/brand book), business (decks/plans), customers (personas/ICP), content (templates/copy), other';

comment on column public.documents.subcategory is
  'Free-text refinement (e.g. logo, brand-book, pitch-deck, persona, case-study)';

comment on column public.documents.is_brand_asset is
  'Quick flag for "always include in brand context" docs (logos, brand book, voice guide)';

comment on column public.documents.importance is
  'RAG retrieval ranking 1-5 (5 = always include, 3 = default, 1 = low priority)';
