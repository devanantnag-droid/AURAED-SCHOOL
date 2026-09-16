-- AURAED SCHOOL — Phase 5: RLS for student_attendance
-- Run after 0008_student_attendance.sql.
--
-- Known limitation, to be addressed when the Parent/Student portal login
-- flow is built: PARENT and STUDENT roles are scoped here by school +
-- permission only, the same as every other role. Narrowing this further to
-- "only their own linked student's attendance" requires students/parents
-- to be linked to actual auth.users accounts, which doesn't exist yet
-- (School Admin currently only invites SCHOOL_ADMIN accounts — Phase 2's
-- Edge Function). A parent-portal onboarding flow is needed before a
-- PARENT role can safely be granted broader read access; until then,
-- PARENT/STUDENT simply won't be assigned attendance.view for real accounts
-- in production, so this is safe.

alter table public.student_attendance enable row level security;

create policy student_attendance_select on public.student_attendance
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('attendance.view'))
  );

create policy student_attendance_insert on public.student_attendance
  for insert
  with check (school_id = public.user_school_id() and public.user_has_permission('attendance.create'));

create policy student_attendance_update on public.student_attendance
  for update
  using (school_id = public.user_school_id() and public.user_has_permission('attendance.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('attendance.edit'));

create policy student_attendance_delete on public.student_attendance
  for delete
  using (school_id = public.user_school_id() and public.user_has_permission('attendance.edit'));

create policy student_attendance_all_super_admin on public.student_attendance
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));
