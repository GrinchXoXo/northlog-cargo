-- Chat / Live Support
-- Migration 0012: conversations, messages, and their functions
--
-- Access model deliberately mirrors the public tracking design already
-- in this project: knowing a shipment's tracking ID already grants
-- read access to that shipment's status (get_public_shipment), so it
-- also grants access to that shipment's support conversation - same
-- trust boundary, nothing new introduced. There is no customer account
-- system; for conversations with no tracking ID (general support), the
-- conversation's own random UUID is the bearer token, stored client-
-- side after creation.
--
-- Public access goes entirely through SECURITY DEFINER functions below,
-- never direct table grants - the same reasoning as
-- get_public_shipment(): RLS cannot safely express "only if you already
-- know the ID" for a broad SELECT policy, so the functions are the only
-- door in.

create type conversation_status as enum ('OPEN', 'CLOSED', 'ARCHIVED');
create type conversation_type as enum ('SHIPMENT', 'GENERAL');
create type message_sender_type as enum ('CUSTOMER', 'ADMIN');

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  tracking_id text references shipments (tracking_id),
  type conversation_type not null default 'SHIPMENT',
  status conversation_status not null default 'OPEN',
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid references auth.users (id),
  archived_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id)
);

-- One conversation per shipment, ever - matches PRD section 2/8/29
-- exactly ("A shipment repeatedly opening chat must not produce
-- multiple conversations"). Enforced at the database level, not just
-- application logic.
create unique index if not exists conversations_tracking_id_unique_idx
  on conversations (tracking_id)
  where tracking_id is not null;

create index if not exists conversations_status_idx on conversations (status);
create index if not exists conversations_last_message_at_idx on conversations (last_message_at desc);

drop trigger if exists conversations_set_updated_at on conversations;
create trigger conversations_set_updated_at
  before update on conversations
  for each row
  execute function set_updated_at();

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_type message_sender_type not null,
  sender_admin_id uuid references auth.users (id),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  deleted_at timestamptz
);

create index if not exists messages_conversation_id_idx on messages (conversation_id, created_at);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table conversations enable row level security;
alter table messages enable row level security;

-- Shared operational team, same reasoning as shipments/tracking_events:
-- any authenticated admin can read and manage any conversation.
create policy "Authenticated admins can read conversations"
  on conversations for select
  to authenticated
  using (true);

create policy "Authenticated admins can update conversations"
  on conversations for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admins can read messages"
  on messages for select
  to authenticated
  using (true);

create policy "Authenticated admins can insert messages"
  on messages for insert
  to authenticated
  with check (sender_type = 'ADMIN');

-- No public/anon policies at all on either table - every public
-- interaction goes through the functions below.

-- ---------------------------------------------------------------------
-- Shared: assemble a conversation's public JSON shape (id, status,
-- tracking_id, messages). Used by all three functions above so the
-- shape returned to the customer-facing widget is always identical
-- regardless of which entry point was used.
-- ---------------------------------------------------------------------
create or replace function get_conversation_json(p_conversation_id uuid)
returns jsonb
language sql
security definer
set search_path = public
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
  where c.id = p_conversation_id and c.deleted_at is null;
$$;

grant execute on function get_conversation_json(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Public: shipment-linked conversation (get-or-create)
-- ---------------------------------------------------------------------
create or replace function get_or_create_shipment_conversation(p_tracking_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tracking_id text := upper(trim(p_tracking_id));
  v_conversation conversations;
begin
  if not exists (select 1 from shipments where tracking_id = v_tracking_id) then
    return null;
  end if;

  select * into v_conversation
  from conversations
  where tracking_id = v_tracking_id and deleted_at is null;

  if v_conversation.id is null then
    insert into conversations (tracking_id, type)
    values (v_tracking_id, 'SHIPMENT')
    returning * into v_conversation;
  end if;

  return get_conversation_json(v_conversation.id);
end;
$$;

grant execute on function get_or_create_shipment_conversation(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Public: general (no tracking ID) conversation
-- ---------------------------------------------------------------------
create or replace function get_or_create_general_conversation(p_conversation_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
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

  insert into conversations (tracking_id, type)
  values (null, 'GENERAL')
  returning * into v_conversation;

  return get_conversation_json(v_conversation.id);
end;
$$;

grant execute on function get_or_create_general_conversation(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Public: send a customer message
-- ---------------------------------------------------------------------
-- A customer message to a CLOSED conversation reopens it - a reply
-- means the issue isn't actually resolved. Archived conversations
-- reject new messages entirely (PRD: archived is removed from active
-- operations, not a place for new activity).
create or replace function send_customer_message(p_conversation_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
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


