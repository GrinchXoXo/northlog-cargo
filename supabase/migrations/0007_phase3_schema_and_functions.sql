-- Phase 3 — Administrator Operations Dashboard
-- Migration 0007: ETA + customs-action fields, updated write/read functions
--
-- Requires 0006 to have already been committed (uses 'CUSTOMS_CLEARANCE').
-- Adds the canonical single-timestamp ETA field for the live countdown
-- (PRD sections 17–19) alongside the existing estimated_delivery_from/to
-- range from Phase 2, which is left in place unused rather than dropped.
-- Also adds the customs "requires action" fields (PRD sections 21–23).

-- ---------------------------------------------------------------------
-- New columns
-- ---------------------------------------------------------------------
alter table shipments
  add column if not exists estimated_delivery_at timestamptz,
  add column if not exists requires_action boolean not null default false,
  add column if not exists action_message text;

alter table shipments
  add constraint action_message_required_when_action_needed
  check (not requires_action or action_message is not null);

-- ---------------------------------------------------------------------
-- Drop the Phase 2 function signatures being superseded
-- ---------------------------------------------------------------------
-- CREATE OR REPLACE only replaces a function with the *same* argument
-- signature — since both functions below change signature, an explicit
-- DROP is required first, or Postgres would leave the Phase 2 versions
-- in place as a second, unreachable-by-name-mismatch overload.
drop function if exists create_shipment_with_event(text, text, text, text, date, date, text, text);
drop function if exists add_tracking_event(uuid, shipment_status, text, numeric, numeric, text, text);

-- ---------------------------------------------------------------------
-- Admin write RPC — supersedes the Phase 2 version of create_shipment_with_event
-- ---------------------------------------------------------------------
-- Switches the ETA parameter from the Phase 2 from/to date range to the
-- new canonical single timestamp, and accepts the customs-action fields
-- at creation time (rarely needed at creation, but avoids a second call
-- for the edge case of pre-flagging a shipment).
create or replace function create_shipment_with_event(
  p_product_description text,
  p_sender_name text,
  p_origin text,
  p_destination text,
  p_estimated_delivery_at timestamptz default null,
  p_product_image_path text default null,
  p_initial_location text default null,
  p_requires_action boolean default false,
  p_action_message text default null
)
returns shipments
language plpgsql
security invoker
as $$
declare
  v_shipment shipments;
  v_location text := coalesce(p_initial_location, p_origin);
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
    auth.uid()
  )
  returning * into v_shipment;

  insert into tracking_events (
    shipment_id, status, location, created_by
  ) values (
    v_shipment.id, 'SHIPMENT_CREATED', v_location, auth.uid()
  );

  return v_shipment;
end;
$$;

grant execute on function create_shipment_with_event(
  text, text, text, text, timestamptz, text, text, boolean, text
) to authenticated;

-- ---------------------------------------------------------------------
-- Admin write RPC — supersedes the Phase 2 version of add_tracking_event
-- ---------------------------------------------------------------------
-- Adds optional ETA and customs-action parameters so a single status
-- update (e.g. "moved to CUSTOMS_CLEARANCE, action required, ETA
-- paused") stays one atomic write, matching PRD section 14's numbered
-- update behavior. p_clear_estimated_delivery lets the admin explicitly
-- null out the ETA (distinct from "not provided", which leaves it
-- untouched) — this is how the ETA gets paused while customs-blocked
-- (PRD section 23).
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
  p_action_message text default null
)
returns tracking_events
language plpgsql
security invoker
as $$
declare
  v_event tracking_events;
begin
  insert into tracking_events (
    shipment_id, status, location, latitude, longitude, note, image_path, created_by
  ) values (
    p_shipment_id, p_status, p_location, p_latitude, p_longitude, p_note, p_image_path, auth.uid()
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
  timestamptz, boolean, boolean, text
) to authenticated;

-- ---------------------------------------------------------------------
-- Public tracking lookup — supersedes the Phase 2 version
-- ---------------------------------------------------------------------
-- Adds estimatedDeliveryAt, requiresAction and actionMessage to the
-- public contract so the tracking page can render the countdown and the
-- customs action banner (PRD sections 18, 22).
create or replace function get_public_shipment(p_tracking_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case when s.id is null then null else jsonb_build_object(
    'trackingId', s.tracking_id,
    'product', jsonb_build_object(
      'description', s.product_description,
      'image', s.product_image_path
    ),
    'sender', jsonb_build_object('name', s.sender_name),
    'origin', s.origin,
    'destination', s.destination,
    'status', s.current_status,
    'currentLocation', jsonb_build_object(
      'label', s.current_location_label,
      'latitude', s.current_latitude,
      'longitude', s.current_longitude,
      'updatedAt', s.current_location_updated_at
    ),
    'estimatedDelivery', jsonb_build_object(
      'from', s.estimated_delivery_from,
      'to', s.estimated_delivery_to
    ),
    'estimatedDeliveryAt', s.estimated_delivery_at,
    'requiresAction', s.requires_action,
    'actionMessage', s.action_message,
    'events', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'status', e.status,
            'location', e.location,
            'timestamp', e.created_at,
            'note', e.note
          )
          order by e.created_at asc
        )
        from tracking_events e
        where e.shipment_id = s.id
      ),
      '[]'::jsonb
    )
  ) end
  from shipments s
  where s.tracking_id = upper(p_tracking_id)
  limit 1;
$$;

grant execute on function get_public_shipment(text) to anon, authenticated;
