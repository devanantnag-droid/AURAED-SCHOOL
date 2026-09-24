-- AURAED SCHOOL — Phase 43: Grant STUDENT vehicle_location.view
-- Run after 0001-0062.
--
-- vehicle_location.view was originally granted to SCHOOL_ADMIN,
-- TRANSPORT_MANAGER, and PARENT (0057) — STUDENT was simply left out.
-- The 0062 fix correctly added a student-ownership branch to the RLS
-- policy itself, but that branch is still gated behind this permission
-- check first, so a student could match the ownership condition and
-- still be blocked for lacking the permission entirely. This is what
-- that looked like in testing: current_student_id() correctly
-- resolved, but user_has_permission('vehicle_location.view') for that
-- same login came back false.

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'STUDENT' and p.code = 'vehicle_location.view'
on conflict do nothing;
