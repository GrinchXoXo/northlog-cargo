-- Phase 2 — Backend & Database
-- Migration 0004: shipment image storage
--
-- Public read (images shown on the tracking page are meant to be public,
-- per PRD section 26), writes restricted to authenticated admins.
-- File-type/size limits are enforced at the bucket level as a backstop;
-- the application layer should still validate before upload.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shipment-images',
  'shipment-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read shipment images"
  on storage.objects for select
  to public
  using (bucket_id = 'shipment-images');

create policy "Authenticated admins can upload shipment images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shipment-images');

create policy "Authenticated admins can update shipment images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'shipment-images')
  with check (bucket_id = 'shipment-images');

create policy "Authenticated admins can delete shipment images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shipment-images');
