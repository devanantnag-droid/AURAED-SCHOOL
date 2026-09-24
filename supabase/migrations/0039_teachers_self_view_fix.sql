-- AURAED SCHOOL — Phase 19 fix: teachers can see their own teacher record
-- Run after 0038_ptm_rls.sql.
--
-- Bug: teachers_select (from Phase 4) only allowed SCHOOL_ADMIN or someone
-- with teachers.view to read the teachers table — a regular teacher could
-- never see even their own row. Anywhere the app joins to teachers(...)
-- while a teacher is logged in (PTM slots/bookings here, and potentially
-- other places), that join silently returns null under RLS, showing a
-- blank name instead of an error. This adds a policy letting a teacher
-- see their own row via teachers.user_id = auth.uid().

create policy teachers_select_own on public.teachers
  for select using (user_id = auth.uid());
