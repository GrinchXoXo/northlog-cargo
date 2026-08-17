-- Phase 4 — Telegram Operations
-- Migration 0009: widen write RPCs for service-role callers
--
-- create_shipment_with_event() and add_tracking_event() currently
-- attribute writes to auth.uid(), which only exists for cookie-session
-- (dashboard) callers. The Telegram bot backend authenticates a
-- different way — it verifies a Telegram user against telegram_accounts
-- and then acts using the service-role key, which has no auth.uid() of
-- its own. Adding an optional p_actor_id lets both callers share the
-- exact same functions: the dashboard omits it (falls back to
-- auth.uid(), unchanged behavior), the bot passes the resolved admin's
-- ID explicitly. This is a new migration rather than an edit to
-- 0003/0007 per the "never modify an already-applied migration" rule.

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
as $$
declare
  v_shipment shipments;
  v_location text := coalesce(p_initial_location, p_origin);
  v_actor uuid := coalesce(p_actor_id, auth.uid());
begin
  insert into shipments (
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
) to authenticated, service_role;

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
as $$
declare
  v_event tracking_events;
  v_actor uuid := coalesce(p_actor_id, auth.uid());
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
  uuid, shipment_status, text, numeric, numeric, text, text, timestamptz, boolean, boolean, text, uuid
) to authenticated, service_role;
