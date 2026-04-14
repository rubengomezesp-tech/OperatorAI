alter table public.users             enable row level security;
alter table public.organizations     enable row level security;
alter table public.memberships       enable row level security;
alter table public.invitations       enable row level security;
alter table public.assistants        enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.documents         enable row level security;
alter table public.document_chunks   enable row level security;
alter table public.memory_entries    enable row level security;
alter table public.voice_requests    enable row level security;
alter table public.image_generations enable row level security;
alter table public.plans             enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.invoices          enable row level security;
alter table public.usage_events      enable row level security;
alter table public.usage_periods     enable row level security;
alter table public.analytics_events  enable row level security;
alter table public.prompt_versions   enable row level security;
alter table public.eval_suites       enable row level security;
alter table public.eval_runs         enable row level security;
alter table public.feedback          enable row level security;
alter table public.jobs              enable row level security;

create policy users_self_select on public.users for select using (id = auth.uid());
create policy users_self_update on public.users for update using (id = auth.uid()) with check (id = auth.uid());

create policy orgs_member_select on public.organizations for select using (public.is_org_member(id));
create policy orgs_admin_update on public.organizations for update using (public.has_org_role(id, array['owner','admin']));
create policy orgs_auth_insert on public.organizations for insert with check (auth.uid() is not null and owner_user_id = auth.uid());

create policy memberships_self_select on public.memberships for select using (user_id = auth.uid() or public.is_org_member(org_id));
create policy memberships_admin_manage on public.memberships for all
  using (public.has_org_role(org_id, array['owner','admin']))
  with check (public.has_org_role(org_id, array['owner','admin']));
create policy memberships_self_insert_owner on public.memberships for insert
  with check (user_id = auth.uid() and role = 'owner');

create policy invitations_admin on public.invitations for all
  using (public.has_org_role(org_id, array['owner','admin']))
  with check (public.has_org_role(org_id, array['owner','admin']));

create policy assistants_read on public.assistants for select using (public.is_org_member(org_id));
create policy assistants_write on public.assistants for all
  using (public.has_org_role(org_id, array['owner','admin','member']))
  with check (public.has_org_role(org_id, array['owner','admin','member']));

create policy conv_read on public.conversations for select using (public.is_org_member(org_id));
create policy conv_write on public.conversations for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy msg_read on public.messages for select using (public.is_org_member(org_id));
create policy msg_write on public.messages for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

create policy doc_read on public.documents for select using (public.is_org_member(org_id));
create policy doc_write on public.documents for all
  using (public.has_org_role(org_id, array['owner','admin','member']))
  with check (public.has_org_role(org_id, array['owner','admin','member']));
create policy chunk_read on public.document_chunks for select using (public.is_org_member(org_id));

create policy mem_read on public.memory_entries for select using (public.is_org_member(org_id));
create policy mem_write on public.memory_entries for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

create policy voice_read on public.voice_requests for select using (public.is_org_member(org_id));
create policy voice_insert on public.voice_requests for insert with check (public.is_org_member(org_id));
create policy images_read on public.image_generations for select using (public.is_org_member(org_id));
create policy images_write on public.image_generations for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

create policy plans_public_read on public.plans for select using (is_public = true);
create policy subs_read on public.subscriptions for select using (public.is_org_member(org_id));
create policy invoices_read on public.invoices for select using (public.is_org_member(org_id));

create policy usage_events_read on public.usage_events for select using (public.has_org_role(org_id, array['owner','admin']));
create policy usage_periods_read on public.usage_periods for select using (public.is_org_member(org_id));

create policy analytics_insert_self on public.analytics_events for insert with check (org_id is null or public.is_org_member(org_id));

create policy fb_read on public.feedback for select using (public.is_org_member(org_id));
create policy fb_write on public.feedback for insert with check (public.is_org_member(org_id));

create policy jobs_admin_read on public.jobs for select
  using (org_id is not null and public.has_org_role(org_id, array['owner','admin']));
