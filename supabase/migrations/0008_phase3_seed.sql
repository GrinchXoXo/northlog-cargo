-- Phase 3 — Administrator Operations Dashboard
-- Migration 0008: seed data for Phase 3 testing
--
-- Requires 0006 and 0007 to have already been committed.

-- Backfill the new canonical ETA field on the Phase 2 seed shipments so
-- the countdown has something to show immediately.
update shipments
set estimated_delivery_at = '2026-08-15T14:00:00Z'
where tracking_id = 'NMX-842731';

-- NMX-113305 is already DELIVERED — no ETA needed.

-- A third seed shipment sitting in CUSTOMS_CLEARANCE with an action
-- required, so the customs UI (admin + public) has something to test
-- against without needing to manually walk a shipment through the full
-- lifecycle first. Not required by the PRD — added for convenience.
insert into shipments (
  tracking_id,
  product_description,
  product_image_path,
  sender_name,
  origin,
  destination,
  current_status,
  current_location_label,
  current_location_updated_at,
  requires_action,
  action_message
) values (
  'NMX-556190',
  'Laptop Replacement Parts',
  null,
  'Priya Nair',
  'Shenzhen, China',
  'Lagos, Nigeria',
  'CUSTOMS_CLEARANCE',
  'Lagos, Nigeria',
  now(),
  true,
  'Your shipment has arrived in the destination country and is currently awaiting customs clearance. Please contact support to complete the required clearance process.'
)
on conflict (tracking_id) do nothing;

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'SHIPMENT_CREATED', 'Shenzhen, China', now() - interval '6 days'
from shipments where tracking_id = 'NMX-556190';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'DEPARTED_ORIGIN', 'Shenzhen, China', now() - interval '5 days'
from shipments where tracking_id = 'NMX-556190';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'IN_TRANSIT', 'International Transit', now() - interval '3 days'
from shipments where tracking_id = 'NMX-556190';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'ARRIVED_DESTINATION_COUNTRY', 'Lagos, Nigeria', now() - interval '1 day'
from shipments where tracking_id = 'NMX-556190';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'CUSTOMS_CLEARANCE', 'Lagos, Nigeria', now()
from shipments where tracking_id = 'NMX-556190';
