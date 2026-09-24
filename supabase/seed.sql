-- DEVELOPMENT-ONLY SEED DATA.
-- Do NOT run this against a production project. It exists solely so you can
-- manually verify the Phase 1 multi-tenant test (docs/PHASE_1_TESTING.md).
--
-- This seeds two schools only. It does NOT create auth.users rows —
-- Supabase Auth users must be created via the dashboard, `supabase auth`,
-- or the sign-up flow, because passwords can't be set via raw SQL. After
-- creating two real users in Auth, grab their UUIDs and assign roles with
-- the commented block at the bottom.

insert into public.schools (id, name, code, email, is_active) values
  ('00000000-0000-0000-0000-0000000000a1', 'School A (Dev)', 'SCH-A', 'admin@school-a.dev', true),
  ('00000000-0000-0000-0000-0000000000b1', 'School B (Dev)', 'SCH-B', 'admin@school-b.dev', true)
on conflict (id) do nothing;

insert into public.school_settings (school_id) values
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b1')
on conflict (school_id) do nothing;

-- After creating two test users in Supabase Auth (e.g. admin.a@test.dev and
-- admin.b@test.dev), run this with their real UUIDs substituted in:
--
-- update public.profiles set school_id = '00000000-0000-0000-0000-0000000000a1', status = 'active'
--   where id = '<AUTH_USER_UUID_FOR_SCHOOL_A_ADMIN>';
-- insert into public.user_roles (user_id, role_id, school_id)
--   select '<AUTH_USER_UUID_FOR_SCHOOL_A_ADMIN>', id, '00000000-0000-0000-0000-0000000000a1'
--   from public.roles where name = 'SCHOOL_ADMIN';
--
-- update public.profiles set school_id = '00000000-0000-0000-0000-0000000000b1', status = 'active'
--   where id = '<AUTH_USER_UUID_FOR_SCHOOL_B_ADMIN>';
-- insert into public.user_roles (user_id, role_id, school_id)
--   select '<AUTH_USER_UUID_FOR_SCHOOL_B_ADMIN>', id, '00000000-0000-0000-0000-0000000000b1'
--   from public.roles where name = 'SCHOOL_ADMIN';
