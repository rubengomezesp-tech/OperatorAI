-- Sprint 4: Image edit history
-- Add parent_image_id to track edit chains in image_generations table.

alter table public.image_generations
  add column if not exists parent_image_id uuid references public.image_generations(id) on delete set null,
  add column if not exists edit_prompt text,
  add column if not exists is_edit boolean default false;

create index if not exists image_generations_parent_idx
  on public.image_generations (parent_image_id)
  where parent_image_id is not null;

create index if not exists image_generations_org_user_idx
  on public.image_generations (org_id, user_id, created_at desc);
