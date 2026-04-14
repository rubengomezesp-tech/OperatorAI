insert into storage.buckets (id, name, public)
values
  ('knowledge',        'knowledge',        false),
  ('voice-input',      'voice-input',      false),
  ('voice-output',     'voice-output',     false),
  ('image-outputs',    'image-outputs',    false),
  ('image-references', 'image-references', false),
  ('avatars',          'avatars',          true),
  ('org-logos',        'org-logos',        true)
on conflict (id) do nothing;

drop policy if exists "members read org files" on storage.objects;
drop policy if exists "members write org files" on storage.objects;
drop policy if exists "members delete org files" on storage.objects;
drop policy if exists "public read public buckets" on storage.objects;

create policy "members read org files" on storage.objects for select
using (
  bucket_id in ('knowledge','voice-input','voice-output','image-outputs','image-references')
  and public.is_org_member((storage.foldername(name))[1])
);

create policy "members write org files" on storage.objects for insert
with check (
  bucket_id in ('knowledge','voice-input','voice-output','image-outputs','image-references')
  and public.is_org_member((storage.foldername(name))[1])
);

create policy "members delete org files" on storage.objects for delete
using (
  bucket_id in ('knowledge','voice-input','voice-output','image-outputs','image-references')
  and public.has_org_role((storage.foldername(name))[1], array['owner','admin','member'])
);

create policy "public read public buckets" on storage.objects for select
using (bucket_id in ('avatars', 'org-logos'));
