create extension if not exists "pgcrypto";
create extension if not exists "vector";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";
create extension if not exists "citext";

create or replace function gen_cuid2() returns text as $$
  select 'c' || replace(replace(encode(gen_random_bytes(12), 'base64'), '/', '_'), '+', '-')
$$ language sql volatile;

create or replace function tg_set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
