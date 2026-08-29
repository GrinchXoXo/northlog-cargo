-- Phase 7 — Security Hardening
-- Migration 0011: fix two issues found during the security/correctness
-- audit in get_public_shipment().
--
-- 1. CORRECTNESS BUG. estimatedDelivery.from/to still read the legacy
--    estimated_delivery_from/estimated_delivery_to columns. Phase 3
--    (0007) switched all writes to a single estimated_delivery_at
--    column and added it to this function's output as a separate
--    field, but never updated estimatedDelivery.from/to to match. The
--    result: every shipment created since Phase 3 has shown a blank
--    Estimated Delivery on the public tracking page, since nothing
--    populates the legacy columns anymore. This preserves the existing
--    { from, to } frontend contract (so no frontend changes are
--    needed) by deriving both from estimated_delivery_at when it's
--    set, falling back to the legacy columns only for old rows that
--    predate Phase 3 and never got the new column populated.
--
-- 2. INFORMATION DISCLOSURE. tracking_events.note is operator-facing
--    free text (see PRD Phase 4 section 20: "do not expose internal-
--    only notes publicly"), but was being returned verbatim in the
--    public events array. Removed from the public contract entirely.
--    Nothing in the public UI ever rendered it from this endpoint
--    intentionally; this closes the gap between what the function
--    returned and what should have been returned.

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
      'from', coalesce(s.estimated_delivery_at, s.estimated_delivery_from::timestamptz),
      'to', coalesce(s.estimated_delivery_at, s.estimated_delivery_to::timestamptz)
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
            'timestamp', e.created_at
            -- 'note' intentionally omitted: internal-only, see above.
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
