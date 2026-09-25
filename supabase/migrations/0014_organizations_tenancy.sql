-- Iteration 1 — Telegram removal + multi-customer foundation
-- Migration 0014: organizations, organization members, backfill, and
-- tenant-scoped RLS.
--
-- What this does, and deliberately does not do:
--
--   * Adds the smallest possible tenancy primitives: `organizations`
--     (one row per Northlog customer) and `organization_members` (which
--     auth user belongs to which organization, and as what role).
--   * Puts `organization_id` on exactly two tables: `shipments` (the
--     root of the shipment domain) and `conversations` (which has
--     rows that are NOT attached to a shipment, so it cannot always
--     derive its tenant). `tracking_events` derive their tenant through
--     their shipment; `messages` through their conversation; storage
--     objects are not tenant-scoped in this iteration (the bucket is
--     intentionally public-read, see 0004).
--   * Backfills — never deletes or recreates — every existing row into
--     a single organization standing in for the existing client, so the
--     data that is already in production keeps working untouched.
--   * Adds every pre-existing auth user to that organization, and
--     re-scopes the broad single-company RLS policies (`using (true)`)
--     to the caller's organization.
--
-- What it deliberately does NOT do: no billing, no invitations, no
-- organization switching, no public signup, no RBAC beyond OWNER/ADMIN,
-- no frontend changes, and no destructive cleanup. The Telegram tables
-- created by 0010 stay in place, unused, and are documented as such in
-- the README rather than dropped here.
--
-- Safe to apply to the existing deployed database: every statement is
-- additive or a backfill, and the file runs as a single transaction.

-- ---------------------------------------------------------------------
-- 1. Organizations
-- ---------------------------------------------------------------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS has to be enabled here, not where the policy is created in
-- section 9: a policy on a table without RLS does nothing, and the
-- default privileges Supabase grants on public tables would leave the
-- organization list world-readable and world-writable. With no
-- INSERT/UPDATE/DELETE policy, provisioning stays a SQL-editor /
-- service-role operation by design (see section 2).
alter table organizations enable row level security;

drop trigger if exists organizations_set_updated_at on organizations;
create trigger organizations_set_updated_at
  before update on organizations
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------
-- 2. Organization membership
-- ---------------------------------------------------------------------
-- Deliberately a text column with a check constraint rather than an
-- enum: adding a third role later must not require the "add enum value
-- in its own transaction" dance that 0006 had to work around, and this
-- iteration only needs two roles anyway.
create table if not exists organization_members (
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'ADMIN' check (role in ('OWNER', 'ADMIN')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx
  on organization_members (user_id);

alter table organization_members enable row level security;

-- Membership is read-only from the browser: provisioning (creating an
-- organization, adding its first admin) is a manual/administrative
-- step this iteration, done in the Supabase dashboard or SQL editor.
-- There is deliberately no INSERT/UPDATE/DELETE policy for
-- authenticated users — a user must not be able to add themselves to
-- an organization they are not already in.
drop policy if exists "Members can read their own membership" on organization_members;
create policy "Members can read their own membership"
  on organization_members for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. Tenant column helper: the caller's organization
-- ---------------------------------------------------------------------
-- SECURITY INVOKER on purpose: it reads organization_members under the
-- same RLS policy as everything else, and it only ever returns the
-- organization of auth.uid() (null for an anonymous caller), so it can
-- never be used to read across tenants. This function — not a value
-- supplied by the browser — is how every policy below decides which
-- organization a request may touch.
-- `search_path = public, pg_temp`: pinning the path stops a caller who
-- can execute SQL from shadowing `organization_members` with a
-- temporary table of the same name — PostgreSQL searches pg_temp first
-- unless it is listed, and listing it last makes the real table win.
create or replace function auth_organization_id()
returns uuid
language sql
stable
set search_path = public, pg_temp
as $$
  select organization_id
  from organization_members
  where user_id = auth.uid()
  order by created_at
  limit 1;
$$;

grant execute on function auth_organization_id() to authenticated;

-- ---------------------------------------------------------------------
-- 4. Tenant column helper: which organization public entry points use
-- ---------------------------------------------------------------------
-- Public visitors have no session and therefore no membership, but
-- starting a general (not shipment-linked) support conversation still
-- has to file the row somewhere. While Northlog serves exactly one
-- customer the answer is unambiguous, so this resolves it. It raises
-- instead of guessing once a second organization exists, which forces
-- the next iteration to replace it with real tenant resolution (by
-- host name or explicit public site configuration) before any second
-- customer's visitors can be routed. SECURITY DEFINER so the result is
-- deployment-wide regardless of who calls it.
create or replace function default_organization_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_id uuid;
begin
  select count(*) into v_count from organizations;

  if v_count = 1 then
    select id into v_id from organizations limit 1;
    return v_id;
  end if;

  raise exception
    'default_organization_id() only works while Northlog serves exactly one organization. '
    'Replace it with explicit tenant resolution before provisioning a second customer.';
end;
$$;

grant execute on function default_organization_id() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5. Tenant columns
-- ---------------------------------------------------------------------
alter table shipments
  add column if not exists organization_id uuid references organizations (id);

alter table conversations
  add column if not exists organization_id uuid references organizations (id);

create index if not exists shipments_organization_id_idx
  on shipments (organization_id);

create index if not exists conversations_organization_id_idx
  on conversations (organization_id);

-- ---------------------------------------------------------------------
-- 6. The existing client becomes the first organization
-- ---------------------------------------------------------------------
-- Name/slug come from the application's own branding constants
-- (SITE_NAME = "Northlog Cargo" in src/lib/constants.ts). Idempotent:
-- re-running keeps the row that already exists.
insert into organizations (name, slug)
values ('Northlog Cargo', 'northlog-cargo')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 7. Backfill existing rows — nothing is deleted or recreated
-- ---------------------------------------------------------------------
-- Shipments: every shipment that already exists belongs to the existing
-- client. tracking_events are intentionally not touched; they reach
-- their tenant through shipments.shipment_id.
update shipments
set organization_id = (select id from organizations where slug = 'northlog-cargo')
where organization_id is null;

-- Conversations linked to a shipment take that shipment's organization
-- (conversation -> shipment -> organization, no second source of
-- truth). The unique index on conversations(tracking_id) guarantees at
-- most one match.
update conversations c
set organization_id = s.organization_id
from shipments s
where c.organization_id is null
  and c.tracking_id = s.tracking_id;

-- Remaining conversations are the general (no tracking ID) ones a
-- visitor started from the public site; they belong to the single
-- organization that has been operating this deployment.
update conversations
set organization_id = (select id from organizations where slug = 'northlog-cargo')
where organization_id is null;

-- Users: anyone who already had an auth account was, by definition, an
-- unrestricted administrator of the single shared dataset — so OWNER
-- preserves exactly the authority they had before this migration, and
-- nothing less. Users who are already a member of any organization are
-- skipped, so re-running cannot silently re-home a user added later.
insert into organization_members (organization_id, user_id, role)
select o.id, u.id, 'OWNER'
from auth.users u
cross join organizations o
where o.slug = 'northlog-cargo'
  and not exists (
    select 1 from organization_members m where m.user_id = u.id
  );

-- ---------------------------------------------------------------------
-- 8. Lock the tenant columns
-- ---------------------------------------------------------------------
-- Only safe because step 7 just filled every row. Failing here would
-- abort the whole transaction rather than ship a half-tenant table.
alter table shipments alter column organization_id set not null;
alter table conversations alter column organization_id set not null;

-- ---------------------------------------------------------------------
-- 9. Organization visibility for members
-- ---------------------------------------------------------------------
drop policy if exists "Members can read their organization" on organizations;
create policy "Members can read their organization"
  on organizations for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 10. Shipments: scope the three broad single-company policies
-- ---------------------------------------------------------------------
-- The predicates from 0002 were `using (true)` — correct then, wrong
-- now. They are replaced one for one; no operation is added or removed,
-- so every dashboard read/write path keeps working for the existing
-- client (whose rows and membership both point at the same single
-- organization). Every `create policy` below is preceded by a `drop
-- policy if exists` — for its own name as well as the one it replaces —
-- because PostgreSQL has no `CREATE POLICY IF NOT EXISTS` and this file
-- is meant to be re-runnable from the SQL editor.
drop policy if exists "Authenticated admins can read shipments" on shipments;
drop policy if exists "Authenticated admins can insert shipments" on shipments;
drop policy if exists "Authenticated admins can update shipments" on shipments;
drop policy if exists "Members can read their organization's shipments" on shipments;
drop policy if exists "Members can insert shipments for their organization" on shipments;
drop policy if exists "Members can update their organization's shipments" on shipments;

create policy "Members can read their organization's shipments"
  on shipments for select
  to authenticated
  using (organization_id = public.auth_organization_id());

create policy "Members can insert shipments for their organization"
  on shipments for insert
  to authenticated
  with check (organization_id = public.auth_organization_id());

create policy "Members can update their organization's shipments"
  on shipments for update
  to authenticated
  using (organization_id = public.auth_organization_id())
  with check (organization_id = public.auth_organization_id());

-- ---------------------------------------------------------------------
-- 11. Tracking events: scoped through their shipment
-- ---------------------------------------------------------------------
-- No organization_id column here on purpose (see the header): storing
-- it again would be a second copy of the truth that could drift.
drop policy if exists "Authenticated admins can read tracking events" on tracking_events;
drop policy if exists "Authenticated admins can insert tracking events" on tracking_events;
drop policy if exists "Members can read their organization's tracking events" on tracking_events;
drop policy if exists "Members can insert tracking events for their organization" on tracking_events;

create policy "Members can read their organization's tracking events"
  on tracking_events for select
  to authenticated
  using (
    exists (
      select 1 from public.shipments s
      where s.id = tracking_events.shipment_id
        and s.organization_id = public.auth_organization_id()
    )
  );

create policy "Members can insert tracking events for their organization"
  on tracking_events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.shipments s
      where s.id = tracking_events.shipment_id
        and s.organization_id = public.auth_organization_id()
    )
  );

-- ---------------------------------------------------------------------
-- 12. Conversations and messages
-- ---------------------------------------------------------------------
-- Conversations carry organization_id (general conversations cannot
-- derive one); messages derive theirs from their conversation.
-- Same set of operations as 0012 — read/update for conversations,
-- read/insert-admin for messages — only the predicates tighten.
drop policy if exists "Authenticated admins can read conversations" on conversations;
drop policy if exists "Authenticated admins can update conversations" on conversations;
drop policy if exists "Authenticated admins can read messages" on messages;
drop policy if exists "Authenticated admins can insert messages" on messages;
drop policy if exists "Members can read their organization's conversations" on conversations;
drop policy if exists "Members can update their organization's conversations" on conversations;
drop policy if exists "Members can read their organization's messages" on messages;
drop policy if exists "Members can insert admin messages for their organization" on messages;

create policy "Members can read their organization's conversations"
  on conversations for select
  to authenticated
  using (organization_id = public.auth_organization_id());

create policy "Members can update their organization's conversations"
  on conversations for update
  to authenticated
  using (organization_id = public.auth_organization_id())
  with check (organization_id = public.auth_organization_id());

create policy "Members can read their organization's messages"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.organization_id = public.auth_organization_id()
    )
  );

create policy "Members can insert admin messages for their organization"
  on messages for insert
  to authenticated
  with check (
    sender_type = 'ADMIN'
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.organization_id = public.auth_organization_id()
    )
  );

-- ---------------------------------------------------------------------
-- 13. Shipment creation now files the row under the caller's org
-- ---------------------------------------------------------------------
-- The 0009 signature is kept (p_actor_id and all) so a call made by a
-- build deployed before this migration still resolves; the superseded
-- 0007 overload is dropped so the function is no longer ambiguous.
-- Everything else about the function is unchanged from 0009.
drop function if exists create_shipment_with_event(text, text, text, text, date, date, text, text);
drop function if exists create_shipment_with_event(text, text, text, text, timestamptz, text, text, boolean, text);

create or replace function create_shipment_with_event(
  p_product_description text,
  p_sender_name text,
  p_origin text,
  p_destination text,
  p_estimated_delivery_at timestamptz default null,
  p_product_image_path text default null,
  p_initial_location text default null,
  p_requires_action boolean default false,
  p_action_message text default null,
  p_actor_id uuid default null
)
returns shipments
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_shipment shipments;
  v_location text := coalesce(p_initial_location, p_origin);
  -- The caller's own identity wins: p_actor_id exists only so a
  -- service-role caller (auth.uid() is null) can still attribute the
  -- row. A signed-in browser session can never stamp someone else's
  -- user ID into created_by.
  v_actor uuid := coalesce(auth.uid(), p_actor_id);
  v_organization uuid := public.auth_organization_id();
begin
  -- The organization comes from the caller's membership, never from a
  -- parameter. Without one the insert would fail the NOT NULL
  -- constraint anyway; failing here says why.
  if v_organization is null then
    raise exception 'Your account is not associated with an organization yet.';
  end if;

  insert into shipments (
    organization_id,
    product_description,
    sender_name,
    origin,
    destination,
    estimated_delivery_at,
    product_image_path,
    current_status,
    current_location_label,
    current_location_updated_at,
    requires_action,
    action_message,
    created_by
  ) values (
    v_organization,
    p_product_description,
    p_sender_name,
    p_origin,
    p_destination,
    p_estimated_delivery_at,
    p_product_image_path,
    'SHIPMENT_CREATED',
    v_location,
    now(),
    p_requires_action,
    p_action_message,
    v_actor
  )
  returning * into v_shipment;

  insert into tracking_events (
    shipment_id, status, location, created_by
  ) values (
    v_shipment.id, 'SHIPMENT_CREATED', v_location, v_actor
  );

  return v_shipment;
end;
$$;

grant execute on function create_shipment_with_event(
  text, text, text, text, timestamptz, text, text, boolean, text, uuid
) to authenticated;

-- add_tracking_event() needs no organization column of its own: it only
-- touches a shipment that already carries one, and both of its writes
-- go through the policies in sections 10/11. Dropping the superseded
-- 0007 overload leaves the single signature the application calls.
drop function if exists add_tracking_event(uuid, shipment_status, text, numeric, numeric, text, text);
drop function if exists add_tracking_event(uuid, shipment_status, text, numeric, numeric, text, text, timestamptz, boolean, boolean, text);

create or replace function add_tracking_event(
  p_shipment_id uuid,
  p_status shipment_status,
  p_location text,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_note text default null,
  p_image_path text default null,
  p_estimated_delivery_at timestamptz default null,
  p_clear_estimated_delivery boolean default false,
  p_requires_action boolean default null,
  p_action_message text default null,
  p_actor_id uuid default null
)
returns tracking_events
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_event tracking_events;
  v_actor uuid := coalesce(auth.uid(), p_actor_id);
begin
  insert into tracking_events (
    shipment_id, status, location, latitude, longitude, note, image_path, created_by
  ) values (
    p_shipment_id, p_status, p_location, p_latitude, p_longitude, p_note, p_image_path, v_actor
  )
  returning * into v_event;

  update shipments
  set
    current_status = p_status,
    current_location_label = p_location,
    current_latitude = coalesce(p_latitude, current_latitude),
    current_longitude = coalesce(p_longitude, current_longitude),
    current_location_updated_at = now(),
    estimated_delivery_at = case
      when p_clear_estimated_delivery then null
      when p_estimated_delivery_at is not null then p_estimated_delivery_at
      else estimated_delivery_at
    end,
    requires_action = coalesce(p_requires_action, requires_action),
    action_message = case
      when p_requires_action is not null then p_action_message
      else action_message
    end
  where id = p_shipment_id;

  return v_event;
end;
$$;

grant execute on function add_tracking_event(
  uuid, shipment_status, text, numeric, numeric, text, text,
  timestamptz, boolean, boolean, text, uuid
) to authenticated;

-- ---------------------------------------------------------------------
-- 14. Public chat entry points file conversations under an org
-- ---------------------------------------------------------------------
-- Both functions stay SECURITY DEFINER (an anonymous visitor has no
-- session and no RLS-visible rows) and keep their exact signatures, so
-- nothing in the client changes. The organization is derived from the
-- shipment for shipment conversations — never taken from the caller.
create or replace function get_or_create_shipment_conversation(p_tracking_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tracking_id text := upper(trim(p_tracking_id));
  v_conversation conversations;
  v_organization uuid;
begin
  select organization_id into v_organization
  from shipments
  where tracking_id = v_tracking_id;

  if v_organization is null then
    return null;
  end if;

  select * into v_conversation
  from conversations
  where tracking_id = v_tracking_id and deleted_at is null;

  if v_conversation.id is null then
    insert into conversations (tracking_id, type, organization_id)
    values (v_tracking_id, 'SHIPMENT', v_organization)
    returning * into v_conversation;
  end if;

  return get_conversation_json(v_conversation.id);
end;
$$;

grant execute on function get_or_create_shipment_conversation(text) to anon, authenticated;

create or replace function get_or_create_general_conversation(p_conversation_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_conversation conversations;
begin
  if p_conversation_id is not null then
    select * into v_conversation
    from conversations
    where id = p_conversation_id and type = 'GENERAL' and deleted_at is null;

    if v_conversation.id is not null then
      return get_conversation_json(v_conversation.id);
    end if;
  end if;

  insert into conversations (tracking_id, type, organization_id)
  values (null, 'GENERAL', default_organization_id())
  returning * into v_conversation;

  return get_conversation_json(v_conversation.id);
end;
$$;

grant execute on function get_or_create_general_conversation(uuid) to anon, authenticated;
