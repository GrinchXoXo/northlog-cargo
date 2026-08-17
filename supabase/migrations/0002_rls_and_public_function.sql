-- Phase 2 — Backend & Database
-- Migration 0002: row-level security + public tracking function
--
-- Public users get zero direct table access. All public reads go through
-- get_public_shipment(), a SECURITY DEFINER function that returns only
-- the fields in the Phase 2 public contract (PRD section 13). This makes
-- "never leak internal fields" structural rather than something every
-- future RLS policy change could accidentally break.

alter table shipments enable row level security;
alter table tracking_events enable row level security;
alter table admin_profiles enable row level security;

-- ---------------------------------------------------------------------
-- No public SELECT policy is created on shipments / tracking_events —
-- the default-deny of RLS means anon/public callers get nothing from
-- direct table queries. All admin operations happen via the
-- authenticated policies below, or via get_public_shipment() for reads.
-- ---------------------------------------------------------------------

create policy "Authenticated admins can read shipments"
  on shipments for select
  to authenticated
  using (true);

create policy "Authenticated admins can insert shipments"
  on shipments for insert
  to authenticated
  with check (true);

create policy "Authenticated admins can update shipments"
  on shipments for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admins can read tracking events"
  on tracking_events for select
  to authenticated
  using (true);

create policy "Authenticated admins can insert tracking events"
  on tracking_events for insert
  to authenticated
  with check (true);

create policy "Admins can read their own profile"
  on admin_profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Admins can update their own profile"
  on admin_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- Public tracking lookup
-- ---------------------------------------------------------------------
-- Returns null if not found. Shape matches the Phase 1 frontend data
-- contract (camelCase keys) so the TS mapping layer stays a thin pass-
-- through rather than a field-by-field transform.
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

-- Public + authenticated clients may call this function; the function
-- body is the only thing controlling what data comes back.
grant execute on function get_public_shipment(text) to anon, authenticated;
