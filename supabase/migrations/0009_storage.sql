-- ==========================================================
-- Mass Diamond — 0009: Storage buckets and policies
-- ==========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('marketplace', 'marketplace', true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('properties', 'properties', true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('businesses', 'businesses', true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('chat-attachments', 'chat-attachments', false, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- avatars: public read, owner-only write, path convention: {user_id}/avatar.ext
create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- marketplace/properties/businesses: public read (buckets are public),
-- write restricted to the owning seller/owner via path convention
-- {user_id}/{listing_id}/{file}.
create policy "marketplace images are publicly readable"
  on storage.objects for select using (bucket_id = 'marketplace');
create policy "sellers upload their own marketplace images"
  on storage.objects for insert
  with check (bucket_id = 'marketplace' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "sellers delete their own marketplace images"
  on storage.objects for delete
  using (bucket_id = 'marketplace' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "property images are publicly readable"
  on storage.objects for select using (bucket_id = 'properties');
create policy "owners upload their own property images"
  on storage.objects for insert
  with check (bucket_id = 'properties' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners delete their own property images"
  on storage.objects for delete
  using (bucket_id = 'properties' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "business images are publicly readable"
  on storage.objects for select using (bucket_id = 'businesses');
create policy "owners upload their own business images"
  on storage.objects for insert
  with check (bucket_id = 'businesses' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners delete their own business images"
  on storage.objects for delete
  using (bucket_id = 'businesses' and (storage.foldername(name))[1] = auth.uid()::text);

-- chat-attachments: PRIVATE bucket. Only the uploader and, via signed
-- URLs generated server-side, the AI Edge Function may read these.
create policy "users upload their own chat attachments"
  on storage.objects for insert
  with check (bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users read their own chat attachments"
  on storage.objects for select
  using (bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete their own chat attachments"
  on storage.objects for delete
  using (bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
