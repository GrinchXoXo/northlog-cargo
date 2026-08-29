-- Chat / Live Support
-- Migration 0013: admin-side conversation management
--
-- These run as the authenticated admin (cookie session), relying on the
-- RLS policies from 0012 for the underlying table access, same pattern
-- as create_shipment_with_event/add_tracking_event.

create or replace function send_admin_message(p_conversation_id uuid, p_body text)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_body text := trim(p_body);
begin
  if v_body = '' or v_body is null then
    raise exception 'Message cannot be empty.';
  end if;
  if length(v_body) > 4000 then
    raise exception 'Message is too long.';
  end if;

  insert into messages (conversation_id, sender_type, sender_admin_id, body)
  values (p_conversation_id, 'ADMIN', auth.uid(), v_body);

  update conversations
  set last_message_at = now(), last_message_preview = left(v_body, 200)
  where id = p_conversation_id;

  return get_conversation_json(p_conversation_id);
end;
$$;

grant execute on function send_admin_message(uuid, text) to authenticated;

create or replace function close_conversation(p_conversation_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  update conversations
  set status = 'CLOSED', closed_at = now(), closed_by = auth.uid()
  where id = p_conversation_id;
end;
$$;

grant execute on function close_conversation(uuid) to authenticated;

create or replace function reopen_conversation(p_conversation_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  update conversations
  set status = 'OPEN', closed_at = null, closed_by = null
  where id = p_conversation_id;
end;
$$;

grant execute on function reopen_conversation(uuid) to authenticated;

create or replace function archive_conversation(p_conversation_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  update conversations
  set status = 'ARCHIVED', archived_at = now()
  where id = p_conversation_id;
end;
$$;

grant execute on function archive_conversation(uuid) to authenticated;

-- Soft delete, per PRD section 17 - preserves the row (and the unique
-- tracking_id constraint stays intact, so the shipment's conversation
-- slot isn't silently freed up for reuse).
create or replace function delete_conversation(p_conversation_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  update conversations
  set deleted_at = now(), deleted_by = auth.uid()
  where id = p_conversation_id;
end;
$$;

grant execute on function delete_conversation(uuid) to authenticated;
