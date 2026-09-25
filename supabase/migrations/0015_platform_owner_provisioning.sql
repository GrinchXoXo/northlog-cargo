-- Iteration 2 — Organization provisioning & platform operator
-- Migration 0015: an explicit platform-owner designation, a default
-- organization for the public website's general support chat, and the
-- server-side RPCs that create an organization together with its first
-- admin.
--
-- Why each piece exists:
--
--   * `platform_owners` is the smallest possible answer to "who may
--     provision organizations?" There is no role hierarchy, no RBAC
--     model, just a list of user IDs. It is RLS-enabled with ZERO
--     policies, so no browser role can read or write it; the only way
--     to consult it is through `is_platform_owner()`, a SECURITY
--     DEFINER function that takes no arguments and therefore only ever
--     answers a question about `auth.uid()`.
--   * `organizations.is_default` replaces Iteration 1's "exactly one
--     organization" guard in `default_organization_id()`. That guard
--     was correct while Northlog served one customer, but the moment a
--     second organization is provisioned it would break the public
--     site's general support chat — which must keep working. Exactly
--     one organization (the one the public website belongs to) is
--     marked as the default instead; the partial unique index makes
--     "at most one" a database invariant rather than a convention.
--   * The provisioning RPCs are SECURITY DEFINER because
--     `organizations` and `organization_members` deliberately have no
--     INSERT policy for `authenticated` (see 0014). Being executable
--     by the browser is not the same as being authorized: every one of
--     them re-checks `is_platform_owner()` as its first statement, so
--     the authorization lives in the database and cannot be bypassed
--     by calling the function directly through PostgREST.
--
-- Additive and backward-compatible: no existing table, column, policy
-- or function signature is dropped. Safe to run on the production
-- database in a single transaction.
--
-- Designating the operator: this migration backfills the earliest
-- pre-existing auth user — that account already had unrestricted
-- access to every row in Iteration 1, so this grants nothing new. To
-- name a different operator afterwards:
--
--   delete from platform_owners;
--   insert into platform_owners (user_id)
--   select id from auth.users where email = 'you@example.com';

-- ---------------------------------------------------------------------
-- 1. Platform operator
-- ---------------------------------------------------------------------
create table if not exists platform_owners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS on, no policies: authenticated and anon get the empty result of
-- "no policy matched" for reads and an RLS violation for writes, which
-- is exactly right for a table that is only ever consulted by a
-- SECURITY DEFINER function.
alter table platform_owners enable row level security;

insert into platform_owners (user_id)
select u.id
from auth.users u
where not exists (select 1 from platform_owners)
order by u.created_at, u.id
limit 1;

create or replace function is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from platform_owners where user_id = auth.uid()
  );
$$;

revoke execute on function is_platform_owner() from public, anon;
grant execute on function is_platform_owner() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Default organization for public general chat
-- ---------------------------------------------------------------------
alter table organizations
  add column if not exists is_default boolean not null default false;

-- At most one default, enforced by the database.
create unique index if not exists organizations_one_default_idx
  on organizations (is_default)
  where is_default;

-- The existing client (the company the public website belongs to)
-- becomes the default. Falls back to the earliest organization if the
-- expected slug is somehow absent.
update organizations
set is_default = true
where id = (
  select id from organizations order by created_at, id limit 1
)
  and not exists (select 1 from organizations where is_default);

-- Supersedes 0014's version: same name, same signature, same SECURITY
-- DEFINER contract, but it resolves an explicitly designated default
-- instead of refusing to answer as soon as a second organization
-- exists. Grants are preserved by CREATE OR REPLACE and re-stated
-- below for clarity.
create or replace function default_organization_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  select id into v_id from organizations where is_default limit 1;

  if v_id is null then
    raise exception
      'No default organization is configured. Set is_default = true on the organization that owns the public website.';
  end if;

  return v_id;
end;
$$;

grant execute on function default_organization_id() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. Resolve an Auth user by email (service-role only)
-- ---------------------------------------------------------------------
-- The provisioning flow has to answer "does this admin email already
-- have a Supabase Auth user?" before it creates one. GoTrue's admin
-- API has no email lookup, but auth.users is a Postgres table. Reading
-- it is restricted to the service-role key: it would be an email
-- enumeration endpoint if authenticated users could call it.
create or replace function find_auth_user_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id
  from auth.users
  where lower(btrim(email)) = lower(btrim(p_email))
  limit 1;
$$;

revoke execute on function find_auth_user_by_email(text) from public, anon, authenticated;
grant execute on function find_auth_user_by_email(text) to service_role;

-- ---------------------------------------------------------------------
-- 4. Platform operator: list organizations
-- ---------------------------------------------------------------------
create or replace function list_organizations()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not is_platform_owner() then
    raise exception 'Only the Northlog platform operator can list organizations.';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug,
          'isDefault', o.is_default,
          'createdAt', o.created_at,
          'memberCount', (
            select count(*) from organization_members m
            where m.organization_id = o.id
          )
        )
        order by o.created_at
      )
      from organizations o
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function list_organizations() from public, anon;
grant execute on function list_organizations() to authenticated;

-- ---------------------------------------------------------------------
-- 5. Platform operator: create an organization and its first admin
-- ---------------------------------------------------------------------
-- One function, one transaction: the organization row and the OWNER
-- membership row are committed together or not at all. The Supabase
-- Auth user cannot participate in that transaction (it lives behind
-- GoTrue's API), so the application creates it first, deliberately:
-- an auth user with no membership is inert and is reused on retry,
-- whereas an organization with no admin would strand a claimed slug.
create or replace function create_organization_with_admin(
  p_name text,
  p_slug text,
  p_admin_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := btrim(p_name);
  v_slug text := btrim(p_slug);
  v_org organizations;
begin
  -- First statement, so a customer admin calling this directly through
  -- PostgREST is rejected by the database itself.
  if not is_platform_owner() then
    raise exception 'Only the Northlog platform operator can create organizations.';
  end if;

  if v_name is null or length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Company name must be between 2 and 120 characters.';
  end if;

  if v_slug is null or length(v_slug) < 2 or length(v_slug) > 64
     or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Slug must be 2-64 characters using lowercase letters, digits and single hyphens.';
  end if;

  if p_admin_user_id is null
     or not exists (select 1 from auth.users where id = p_admin_user_id) then
    raise exception 'No Supabase Auth user exists for that admin email. Create the user, then retry.';
  end if;

  if exists (select 1 from organization_members where user_id = p_admin_user_id) then
    raise exception 'That user already belongs to an organization and cannot become its first admin.';
  end if;

  if exists (select 1 from organizations where slug = v_slug) then
    raise exception 'An organization with that slug already exists.';
  end if;

  begin
    insert into organizations (name, slug)
    values (v_name, v_slug)
    returning * into v_org;
  exception when unique_violation then
    raise exception 'An organization with that slug already exists.';
  end;

  insert into organization_members (organization_id, user_id, role)
  values (v_org.id, p_admin_user_id, 'OWNER');

  return jsonb_build_object(
    'id', v_org.id,
    'name', v_org.name,
    'slug', v_org.slug,
    'isDefault', v_org.is_default,
    'createdAt', v_org.created_at
  );
end;
$$;

revoke execute on function create_organization_with_admin(text, text, uuid) from public, anon;
grant execute on function create_organization_with_admin(text, text, uuid) to authenticated;
