-- Iteration 2.1 — Security review & tenant-isolation hardening
-- Migration 0016
--
-- Three verified problems found by reviewing Iteration 1/2 against the
-- database rather than against the passing harness output. Nothing here
-- drops a table, a column or a row: every statement either pins a
-- function's search_path, replaces a function body with an additional
-- authorization check, or replaces a storage policy with a narrower one.
--
-- 1. search_path pinning (functions).
--    `set search_path = public` still searches pg_temp FIRST, because
--    PostgreSQL only honours pg_temp's position in the path when pg_temp
--    is named explicitly. A caller who can execute SQL can therefore
--    create a TEMPORARY table that shadows the real one inside a
--    SECURITY DEFINER function — verified: `is_platform_owner()` returned
--    true for a non-owner when pg_temp shadowed `platform_owners`. Every
--    function that matters now has `search_path = public, pg_temp`, which
--    puts the temporary schema last so the real object wins. Policies get
--    the same protection by schema-qualifying their references (done in
--    0014, which had not been applied yet when this was written).
--
-- 2. Conversation access by ID (chat).
--    `get_conversation_json()`, `send_customer_message()` and
--    `get_or_create_general_conversation()` are SECURITY DEFINER and were
--    reachable by any authenticated caller holding a conversation UUID:
--    RLS said no to a direct table read, the RPC said yes. General
--    conversations are the only genuinely private ones (shipment
--    conversations are reachable by tracking ID for everyone, by design —
--    see the header of 0012), so a tenant check is now applied to them
--    for authenticated callers who belong to an organization. Anonymous
--    visitors keep the documented capability model: the conversation UUID
--    itself is the credential.
--
-- 3. Storage write isolation.
--    The 0004 policies let ANY authenticated user upload, overwrite or
--    delete ANY object in the public `shipment-images` bucket, and image
--    paths are returned by get_public_shipment() — so a member of another
--    organization could deface the existing client's public images.
--    Reads stay public (PRD section 26). Writes now require an
--    organization membership, and overwriting/deleting an object further
--    requires that the object be referenced by a shipment of the caller's
--    organization. The upload path convention (a bare UUID created before
--    the shipment exists) is unchanged, so no application code changes.
--
-- Apply after 0014 and 0015, in order, as a single statement batch.

-- ---------------------------------------------------------------------
-- 1. Pin search_path on every function that matters
-- ---------------------------------------------------------------------
-- ALTER FUNCTION only rewrites the configuration setting — the function
-- body is not re-entered, so there is nothing to mistype and no
-- behaviour change for a legitimate caller.

-- Public tracking (0011) and the public chat entry points (0012/0014).
alter function public.get_public_shipment(text)
  set search_path = public, pg_temp;
alter function public.get_conversation_json(uuid)
  set search_path = public, pg_temp;
alter function public.get_or_create_shipment_conversation(text)
  set search_path = public, pg_temp;
alter function public.get_or_create_general_conversation(uuid)
  set search_path = public, pg_temp;
alter function public.send_customer_message(uuid, text)
  set search_path = public, pg_temp;

-- Admin-side chat RPCs (0013, SECURITY INVOKER but still worth pinning).
alter function public.send_admin_message(uuid, text)
  set search_path = public, pg_temp;
alter function public.close_conversation(uuid)
  set search_path = public, pg_temp;
alter function public.reopen_conversation(uuid)
  set search_path = public, pg_temp;
alter function public.archive_conversation(uuid)
  set search_path = public, pg_temp;
alter function public.delete_conversation(uuid)
  set search_path = public, pg_temp;

-- Tenancy and provisioning helpers (0014/0015). These already declare
-- `public, pg_temp` when those files are applied in their current form;
-- repeating it here means the hardening also holds if an earlier copy of
-- 0014/0015 was applied.
alter function public.auth_organization_id()
  set search_path = public, pg_temp;
alter function public.default_organization_id()
  set search_path = public, pg_temp;
alter function public.create_shipment_with_event(text, text, text, text, timestamptz, text, text, boolean, text, uuid)
  set search_path = public, pg_temp;
alter function public.add_tracking_event(uuid, shipment_status, text, numeric, numeric, text, text, timestamptz, boolean, boolean, text, uuid)
  set search_path = public, pg_temp;
alter function public.is_platform_owner()
  set search_path = public, pg_temp;
alter function public.list_organizations()
  set search_path = public, pg_temp;
alter function public.create_organization_with_admin(text, text, uuid)
  set search_path = public, pg_temp;
alter function public.find_auth_user_by_email(text)
  set search_path = public, pg_temp;

-- ---------------------------------------------------------------------
-- 2. Tenant check for private (GENERAL) conversations
-- ---------------------------------------------------------------------
-- Returns true when the caller may see this conversation, raises the
-- same "not found" message a missing conversation produces otherwise, so
-- a refused access is indistinguishable from a conversation that does
-- not exist.
--
-- Rules, in order:
--   * missing conversation  -> true (the caller reports its own not-found)
--   * SHIPMENT conversation -> true (public by tracking ID, by design)
--   * anonymous caller      -> true (the UUID is the credential)
--   * no organization       -> true (treated like any other visitor)
--   * own organization      -> true
--   * the default organization (the public website's own) -> true
--   * anything else         -> raise
--
-- Executed only from within the SECURITY DEFINER functions below, so it
-- is granted to nobody: the owner of the calling function executes it.
create or replace function assert_conversation_tenant_access(p_conversation_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_organization uuid;
  v_type conversation_type;
begin
  select organization_id, type
  into v_organization, v_type
  from conversations
  where id = p_conversation_id and deleted_at is null;

  if v_organization is null then
    return true;
  end if;

  if v_type <> 'GENERAL' then
    return true;
  end if;

  if auth.uid() is null then
    return true;
  end if;

  if not exists (
    select 1 from organization_members where user_id = auth.uid()
  ) then
    return true;
  end if;

  if exists (
    select 1 from organization_members
    where user_id = auth.uid() and organization_id = v_organization
  ) then
    return true;
  end if;

  if v_organization = (select id from organizations where is_default limit 1) then
    return true;
  end if;

  raise exception 'Conversation not found.';
end;
$$;

revoke execute on function assert_conversation_tenant_access(uuid)
  from public, anon, authenticated, service_role;

-- get_conversation_json(): the same body as 0012, plus the tenant check
-- in the WHERE clause. Evaluation is safe in both directions: a missing
-- conversation simply matches no row (the function returns null, as
-- before), and a denied one raises instead of matching.
create or replace function get_conversation_json(p_conversation_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', c.id,
    'trackingId', c.tracking_id,
    'type', c.type,
    'status', c.status,
    'messages', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'senderType', m.sender_type,
            'body', m.body,
            'createdAt', m.created_at
          )
          order by m.created_at asc
        )
        from messages m
        where m.conversation_id = c.id and m.deleted_at is null
      ),
      '[]'::jsonb
    )
  )
  from conversations c
  where c.id = p_conversation_id
    and c.deleted_at is null
    and public.assert_conversation_tenant_access(p_conversation_id);
$$;

grant execute on function get_conversation_json(uuid) to anon, authenticated;

-- send_customer_message(): check before writing, so a refused send never
-- inserts a message and the error the customer sees is the normal
-- not-found message.
create or replace function send_customer_message(p_conversation_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_conversation conversations;
  v_body text := trim(p_body);
begin
  if v_body = '' or v_body is null then
    raise exception 'Message cannot be empty.';
  end if;
  if length(v_body) > 4000 then
    raise exception 'Message is too long.';
  end if;

  select * into v_conversation
  from conversations
  where id = p_conversation_id and deleted_at is null;

  if v_conversation.id is null then
    raise exception 'Conversation not found.';
  end if;

  perform public.assert_conversation_tenant_access(p_conversation_id);

  if v_conversation.status = 'ARCHIVED' then
    raise exception 'This conversation is archived.';
  end if;

  insert into messages (conversation_id, sender_type, body)
  values (p_conversation_id, 'CUSTOMER', v_body);

  update conversations
  set
    last_message_at = now(),
    last_message_preview = left(v_body, 200),
    status = case when status = 'CLOSED' then 'OPEN' else status end
  where id = p_conversation_id;

  return get_conversation_json(p_conversation_id);
end;
$$;

grant execute on function send_customer_message(uuid, text) to anon, authenticated;

-- get_or_create_general_conversation(): the 0014 body plus the same
-- check when a visitor resumes an existing conversation by ID. A stale
-- or unknown ID still falls through to creating a fresh conversation,
-- exactly as before.
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
    perform public.assert_conversation_tenant_access(p_conversation_id);

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

-- ---------------------------------------------------------------------
-- 3. Storage: keep public reads, scope writes to the owning tenant
-- ---------------------------------------------------------------------
-- Public read is deliberate (PRD section 26: shipment images shown on
-- the tracking page are public) and is left untouched.

-- Both generations are dropped first so this file can be pasted twice
-- into the SQL editor without the second run failing.
drop policy if exists "Authenticated admins can upload shipment images" on storage.objects;
drop policy if exists "Authenticated admins can update shipment images" on storage.objects;
drop policy if exists "Authenticated admins can delete shipment images" on storage.objects;
drop policy if exists "Members can upload shipment images" on storage.objects;
drop policy if exists "Members can update their organization's shipment images" on storage.objects;
drop policy if exists "Members can delete their organization's shipment images" on storage.objects;

-- Uploading needs an organization. The object is not referenced by a
-- shipment yet at this moment (the form uploads before the shipment
-- exists), so membership is the strongest check available here.
create policy "Members can upload shipment images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'shipment-images'
    and public.auth_organization_id() is not null
  );

-- Overwriting or deleting an existing object additionally requires that
-- the object belong to a shipment of the caller's organization: either
-- the product image or an event image.
create policy "Members can update their organization's shipment images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'shipment-images'
    and public.auth_organization_id() is not null
    and exists (
      select 1 from public.shipments s
      where s.organization_id = public.auth_organization_id()
        and (
          s.product_image_path = storage.objects.name
          or exists (
            select 1 from public.tracking_events e
            where e.shipment_id = s.id
              and e.image_path = storage.objects.name
          )
        )
    )
  )
  with check (
    bucket_id = 'shipment-images'
    and public.auth_organization_id() is not null
  );

create policy "Members can delete their organization's shipment images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'shipment-images'
    and public.auth_organization_id() is not null
    and exists (
      select 1 from public.shipments s
      where s.organization_id = public.auth_organization_id()
        and (
          s.product_image_path = storage.objects.name
          or exists (
            select 1 from public.tracking_events e
            where e.shipment_id = s.id
              and e.image_path = storage.objects.name
          )
        )
    )
  );
