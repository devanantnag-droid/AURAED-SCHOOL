-- AURAED SCHOOL — Phase 6: RLS for teacher punch records and corrections
-- Run after 0010_teacher_punch.sql.

alter table public.teacher_punch_records enable row level security;
alter table public.attendance_correction_requests enable row level security;

-- =========================================================================
-- TEACHER PUNCH RECORDS
-- A teacher can only ever read/write their OWN punch records (matched via
-- current_teacher_id(), which resolves from their own auth.uid()) — they
-- can never punch in on behalf of another teacher, even if they somehow
-- guessed another teacher's id. School Admin/HR can view and manage all
-- records for their school (needed for reports and corrections).
-- =========================================================================
create policy teacher_punch_select on public.teacher_punch_records
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or teacher_id = public.current_teacher_id()
    or (school_id = public.user_school_id() and public.user_has_permission('attendance.view'))
  );

create policy teacher_punch_insert_self on public.teacher_punch_records
  for insert
  with check (
    teacher_id = public.current_teacher_id()
    and school_id = public.user_school_id()
  );

create policy teacher_punch_update_self on public.teacher_punch_records
  for update
  using (teacher_id = public.current_teacher_id() and school_id = public.user_school_id())
  with check (teacher_id = public.current_teacher_id() and school_id = public.user_school_id());

-- Admin/HR write access exists ONLY so the apply_attendance_correction()
-- function (which runs as the approving admin, security definer) can write
-- corrected punch records. Direct ad-hoc edits by an admin bypassing the
-- correction workflow are intentionally not exposed in the UI.
create policy teacher_punch_admin_write on public.teacher_punch_records
  for update
  using (school_id = public.user_school_id() and public.user_has_permission('attendance.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('attendance.edit'));

create policy teacher_punch_admin_insert on public.teacher_punch_records
  for insert
  with check (school_id = public.user_school_id() and public.user_has_permission('attendance.edit'));

create policy teacher_punch_all_super_admin on public.teacher_punch_records
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- ATTENDANCE CORRECTION REQUESTS
-- Teacher can create/view their own requests. School Admin/HR (anyone with
-- attendance.edit) can view and approve/reject all requests in their school.
-- =========================================================================
create policy correction_requests_select on public.attendance_correction_requests
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or teacher_id = public.current_teacher_id()
    or (school_id = public.user_school_id() and public.user_has_permission('attendance.edit'))
  );

create policy correction_requests_insert_self on public.attendance_correction_requests
  for insert
  with check (teacher_id = public.current_teacher_id() and school_id = public.user_school_id());

create policy correction_requests_admin_update on public.attendance_correction_requests
  for update
  using (school_id = public.user_school_id() and public.user_has_permission('attendance.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('attendance.edit'));

create policy correction_requests_all_super_admin on public.attendance_correction_requests
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));
