-- Phase 2 — Backend & Database
-- Migration 0001: core schema
--
-- Creates the shipment status enum, the shipments and tracking_events
-- tables, supporting indexes, and a tracking-ID generator function.
-- See PRD/Phase_02___Backend___Database.md sections 7–11.

-- ---------------------------------------------------------------------
-- Shipment status enum
-- ---------------------------------------------------------------------
-- Canonical 10-value lifecycle from MASTER-PRD.md section 11 /
-- Phase 2 PRD section 9.
create type shipment_status as enum (
  'SHIPMENT_CREATED',
  'RECEIVED_AT_ORIGIN',
  'PROCESSING',
  'DEPARTED_ORIGIN',
  'IN_TRANSIT',
  'ARRIVED_DESTINATION_COUNTRY',
  'RECEIVED_LOCAL_FACILITY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION'
);

-- ---------------------------------------------------------------------
-- Administrator profile (optional metadata on top of Supabase Auth)
-- ---------------------------------------------------------------------
create table if not exists admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Tracking ID generator
-- ---------------------------------------------------------------------
-- Human-readable, publicly shareable, not derived from the row's UUID.
-- Retries on collision. Prefix is a literal here for the MVP; see
-- PRD section 8 — "the prefix should be configurable later."
create or replace function generate_tracking_id()
returns text
language plpgsql
as $$
declare
  candidate text;
  collision boolean;
begin
  loop
    candidate := 'NMX-' || lpad(floor(random() * 1000000)::text, 6, '0');
    select exists(
      select 1 from shipments where tracking_id = candidate
    ) into collision;
    exit when not collision;
  end loop;
  return candidate;
end;
$$;

-- ---------------------------------------------------------------------
-- Shipments
-- ---------------------------------------------------------------------
create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null unique default generate_tracking_id(),
  product_description text not null,
  product_image_path text,
  sender_name text not null,
  origin text not null,
  destination text not null,
  current_status shipment_status not null default 'SHIPMENT_CREATED',
  current_location_label text,
  current_latitude numeric,
  current_longitude numeric,
  current_location_updated_at timestamptz,
  estimated_delivery_from date,
  estimated_delivery_to date,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists shipments_tracking_id_idx
  on shipments (tracking_id);

-- ---------------------------------------------------------------------
-- Tracking events (append-only history)
-- ---------------------------------------------------------------------
create table if not exists tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments (id) on delete cascade,
  status shipment_status not null,
  location text not null,
  latitude numeric,
  longitude numeric,
  note text,
  image_path text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists tracking_events_shipment_id_idx
  on tracking_events (shipment_id);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shipments_set_updated_at on shipments;
create trigger shipments_set_updated_at
  before update on shipments
  for each row
  execute function set_updated_at();

drop trigger if exists admin_profiles_set_updated_at on admin_profiles;
create trigger admin_profiles_set_updated_at
  before update on admin_profiles
  for each row
  execute function set_updated_at();
