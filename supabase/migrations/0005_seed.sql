-- Phase 2 — Backend & Database
-- Migration 0005: seed data
--
-- Reproduces the Phase 1 example shipment (PRD section 26) so the public
-- tracking page has real data to hit immediately after migration.
-- Uses an explicit tracking_id rather than the generator so this ID
-- stays stable and matches Phase 1's documented example / this repo's
-- README instructions.
--
-- Intended for a one-time run against a fresh database. tracking_events
-- has no unique constraint (it's an append-only log), so re-running this
-- file will duplicate event rows — drop and re-seed instead of re-running.

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
  estimated_delivery_from,
  estimated_delivery_to
) values (
  'NMX-842731',
  'Nike Air Max Shoes',
  null,
  'John Doe',
  'Guangzhou, China',
  'Lagos, Nigeria',
  'IN_TRANSIT',
  'International Transit',
  '2026-08-07T04:15:00Z',
  '2026-08-14',
  '2026-08-16'
)
on conflict (tracking_id) do nothing;

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'SHIPMENT_CREATED', 'Guangzhou, China', '2026-08-06T09:42:00Z'
from shipments where tracking_id = 'NMX-842731';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'DEPARTED_ORIGIN', 'Guangzhou, China', '2026-08-06T18:20:00Z'
from shipments where tracking_id = 'NMX-842731';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'IN_TRANSIT', 'International Transit', '2026-08-07T04:15:00Z'
from shipments where tracking_id = 'NMX-842731';

-- A second, delivered shipment for exercising the terminal-state UI.
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
  estimated_delivery_from,
  estimated_delivery_to
) values (
  'NMX-113305',
  'Office Desk Chair',
  null,
  'Amara Okoye',
  'Istanbul, Turkey',
  'Port Harcourt, Nigeria',
  'DELIVERED',
  'Port Harcourt, Nigeria',
  '2026-08-05T15:02:00Z',
  '2026-08-05',
  '2026-08-05'
)
on conflict (tracking_id) do nothing;

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'SHIPMENT_CREATED', 'Istanbul, Turkey', '2026-07-29T10:00:00Z'
from shipments where tracking_id = 'NMX-113305';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'DEPARTED_ORIGIN', 'Istanbul, Turkey', '2026-07-30T06:40:00Z'
from shipments where tracking_id = 'NMX-113305';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'IN_TRANSIT', 'International Transit', '2026-08-01T12:00:00Z'
from shipments where tracking_id = 'NMX-113305';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'ARRIVED_DESTINATION_COUNTRY', 'Lagos, Nigeria', '2026-08-03T09:15:00Z'
from shipments where tracking_id = 'NMX-113305';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'RECEIVED_LOCAL_FACILITY', 'Port Harcourt, Nigeria', '2026-08-04T08:30:00Z'
from shipments where tracking_id = 'NMX-113305';

insert into tracking_events (shipment_id, status, location, created_at)
select id, 'OUT_FOR_DELIVERY', 'Port Harcourt, Nigeria', '2026-08-05T09:10:00Z'
from shipments where tracking_id = 'NMX-113305';

insert into tracking_events (shipment_id, status, location, note, created_at)
select id, 'DELIVERED', 'Port Harcourt, Nigeria', 'Received by front desk.', '2026-08-05T15:02:00Z'
from shipments where tracking_id = 'NMX-113305';
