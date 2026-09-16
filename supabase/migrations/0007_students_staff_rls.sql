-- AURAED SCHOOL — Phase 4: RLS for students/parents/teachers/staff
-- Run after 0006_students_staff.sql.

alter table public.students enable row level security;
alter table public.parents enable row level security;
alter table public.parent_students enable row level security;
alter table public.teachers enable row level security;
alter table public.staff enable row level security;

-- =========================================================================
-- STUDENTS
-- =========================================================================
create policy students_select on public.students
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('students.view'))
  );

create policy students_insert on public.students
  for insert
  with check (school_id = public.user_school_id() and public.user_has_permission('students.create'));

create policy students_update on public.students
  for update
  using (school_id = public.user_school_id() and public.user_has_permission('students.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('students.edit'));

create policy students_delete on public.students
  for delete
  using (school_id = public.user_school_id() and public.user_has_permission('students.delete'));

create policy students_all_super_admin on public.students
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- PARENTS
-- =========================================================================
create policy parents_select on public.parents
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('parents.view'))
  );

create policy parents_insert on public.parents
  for insert
  with check (school_id = public.user_school_id() and public.user_has_permission('parents.create'));

create policy parents_update on public.parents
  for update
  using (school_id = public.user_school_id() and public.user_has_permission('parents.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('parents.edit'));

create policy parents_delete on public.parents
  for delete
  using (school_id = public.user_school_id() and public.user_has_permission('parents.delete'));

create policy parents_all_super_admin on public.parents
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- PARENT_STUDENTS — junction table. Access follows the parent row's school
-- (a parent and their linked student are always in the same school; the
-- app layer enforces this when creating links, RLS enforces it can't be
-- bypassed by checking both sides resolve to the caller's school).
-- =========================================================================
create policy parent_students_select on public.parent_students
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or exists (
      select 1 from public.parents p
      where p.id = parent_students.parent_id
        and p.school_id = public.user_school_id()
        and public.user_has_permission('parents.view')
    )
  );

create policy parent_students_write on public.parent_students
  for all
  using (
    public.user_has_role('SUPER_ADMIN')
    or exists (
      select 1 from public.parents p
      where p.id = parent_students.parent_id
        and p.school_id = public.user_school_id()
        and public.user_has_permission('parents.edit')
    )
  )
  with check (
    public.user_has_role('SUPER_ADMIN')
    or (
      exists (
        select 1 from public.parents p
        where p.id = parent_students.parent_id
          and p.school_id = public.user_school_id()
          and public.user_has_permission('parents.edit')
      )
      and exists (
        select 1 from public.students s
        where s.id = parent_students.student_id
          and s.school_id = public.user_school_id()
      )
    )
  );

-- =========================================================================
-- TEACHERS
-- =========================================================================
create policy teachers_select on public.teachers
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('teachers.view'))
  );

create policy teachers_insert on public.teachers
  for insert
  with check (school_id = public.user_school_id() and public.user_has_permission('teachers.create'));

create policy teachers_update on public.teachers
  for update
  using (school_id = public.user_school_id() and public.user_has_permission('teachers.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('teachers.edit'));

create policy teachers_delete on public.teachers
  for delete
  using (school_id = public.user_school_id() and public.user_has_permission('teachers.delete'));

create policy teachers_all_super_admin on public.teachers
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- STAFF
-- =========================================================================
create policy staff_select on public.staff
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('staff.view'))
  );

create policy staff_insert on public.staff
  for insert
  with check (school_id = public.user_school_id() and public.user_has_permission('staff.create'));

create policy staff_update on public.staff
  for update
  using (school_id = public.user_school_id() and public.user_has_permission('staff.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('staff.edit'));

create policy staff_delete on public.staff
  for delete
  using (school_id = public.user_school_id() and public.user_has_permission('staff.delete'));

create policy staff_all_super_admin on public.staff
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));
