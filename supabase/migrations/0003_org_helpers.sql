create or replace function public.is_org_member(target_org_id text) returns boolean as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and org_id = target_org_id
      and status = 'active'
  );
$$ language sql stable security definer set search_path = public;

create or replace function public.has_org_role(target_org_id text, required_roles text[]) returns boolean as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and org_id = target_org_id
      and status = 'active'
      and role::text = any(required_roles)
  );
$$ language sql stable security definer set search_path = public;
