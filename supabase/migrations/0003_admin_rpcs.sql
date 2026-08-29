-- Phase 2 — Backend & Database
-- Migration 0003: admin write RPCs
--
-- Wraps the "update shipment + insert tracking event" workflow (PRD
-- section 11, Event History Principle) in single-transaction functions
-- so a partial write can't leave the shipment and its history out of
-- sync. Both are SECURITY INVOKER (the default) so the existing
-- authenticated RLS policies on shipments/tracking_events still apply —
-- these are conveniences, not privilege escalations.

-- ---------------------------------------------------------------------
-- Create a shipment and its first tracking event together.
-- ---------------------------------------------------------------------
create or replace function create_shipment_with_event(
  p_product_description text,
  p_sender_name text,
  p_origin text,
  p_destination text,
  p_estimated_delivery_from date default null,
  p_estimated_delivery_to date default null,
  p_product_image_path text default null,
  p_initial_location text default null
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
    estimated_delivery_from,
    estimated_delivery_to,
    product_image_path,
    current_status,
    current_location_label,
    current_location_updated_at,
    created_by
  ) values (
    p_product_description,
    p_sender_name,
    p_origin,
    p_destination,
    p_estimated_delivery_from,
    p_estimated_delivery_to,
    p_product_image_path,
    'SHIPMENT_CREATED',
    v_location,
    now(),
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
  text, text, text, text, date, date, text, text
) to authenticated;

-- ---------------------------------------------------------------------
-- Add a tracking event and update the shipment's current snapshot.
-- ---------------------------------------------------------------------
create or replace function add_tracking_event(
  p_shipment_id uuid,
  p_status shipment_status,
  p_location text,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_note text default null,
  p_image_path text default null
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
    current_location_updated_at = now()
  where id = p_shipment_id;

  return v_event;
end;
$$;

grant execute on function add_tracking_event(
  uuid, shipment_status, text, numeric, numeric, text, text
) to authenticated;
