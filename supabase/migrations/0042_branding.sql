-- AURAED SCHOOL — Phase 21: Settings & Branding
-- Run after 0001-0041.
--
-- No new tables — the schools table already has every branding field
-- (name, logo_url, principal_name, website, description, contact info)
-- since Phase 1, and School Admin could already update their own school's
-- row since Phase 2's schools_update_own_admin policy (everything except
-- code/is_active, enforced by a trigger). This phase only adds a place to
-- actually store an uploaded logo file.
--
-- Unlike every other Storage bucket in this app (private, per-school
-- folder, signed URLs), the branding bucket is PUBLIC — a school's logo
-- is meant to be displayed (in the app header, on PDFs), not
-- access-controlled, so a public URL avoids fetching a fresh signed URL
-- on every render. Nothing sensitive belongs in this bucket.

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Anyone can view (bucket is public, but an explicit select policy is
-- still required for storage.objects reads to succeed).
create policy branding_files_select on storage.objects
  for select using (bucket_id = 'branding');

-- Only a School Admin may upload/replace/delete their own school's logo,
-- identified by the first path segment matching their school_id — same
-- per-school-folder convention as every other bucket.
create policy branding_files_insert on storage.objects
  for insert
  with check (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = public.user_school_id()::text
    and public.user_has_role('SCHOOL_ADMIN')
  );

create policy branding_files_update on storage.objects
  for update using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = public.user_school_id()::text
    and public.user_has_role('SCHOOL_ADMIN')
  );

create policy branding_files_delete on storage.objects
  for delete using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = public.user_school_id()::text
    and public.user_has_role('SCHOOL_ADMIN')
  );
