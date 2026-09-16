-- AURAED SCHOOL — Phase 7: RLS for academics tables
-- Run after 0012_academics.sql.

-- New permission covering all academics management (sessions, classes,
-- sections, subjects, assignments, timetable) — one permission rather than
-- one per table, since these are always managed together by the same
-- people (School Admin, occasionally a designated staff member).
insert into public.permissions (code, description) values
  ('academics.view', 'View academic structure and timetable'),
  ('academics.manage', 'Manage academic sessions, classes, sections, subjects, and timetable')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('academics.view', 'academics.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'TEACHER' and p.code = 'academics.view'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('PARENT', 'STUDENT', 'RECEPTIONIST') and p.code = 'academics.view'
on conflict do nothing;

alter table public.academic_sessions enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.subjects enable row level security;
alter table public.class_teachers enable row level security;
alter table public.subject_teachers enable row level security;
alter table public.timetables enable row level security;

-- Generic pattern reused for every academics table: anyone in the school
-- with academics.view can read; only academics.manage can write.
create policy academic_sessions_select on public.academic_sessions
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('academics.view')));
create policy academic_sessions_write on public.academic_sessions
  for all using (school_id = public.user_school_id() and public.user_has_permission('academics.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('academics.manage'));
create policy academic_sessions_super_admin on public.academic_sessions
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy classes_select on public.classes
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('academics.view')));
create policy classes_write on public.classes
  for all using (school_id = public.user_school_id() and public.user_has_permission('academics.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('academics.manage'));
create policy classes_super_admin on public.classes
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy sections_select on public.sections
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('academics.view')));
create policy sections_write on public.sections
  for all using (school_id = public.user_school_id() and public.user_has_permission('academics.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('academics.manage'));
create policy sections_super_admin on public.sections
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy subjects_select on public.subjects
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('academics.view')));
create policy subjects_write on public.subjects
  for all using (school_id = public.user_school_id() and public.user_has_permission('academics.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('academics.manage'));
create policy subjects_super_admin on public.subjects
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy class_teachers_select on public.class_teachers
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('academics.view'))
    or teacher_id = public.current_teacher_id()
  );
create policy class_teachers_write on public.class_teachers
  for all using (school_id = public.user_school_id() and public.user_has_permission('academics.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('academics.manage'));
create policy class_teachers_super_admin on public.class_teachers
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy subject_teachers_select on public.subject_teachers
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('academics.view'))
    or teacher_id = public.current_teacher_id()
  );
create policy subject_teachers_write on public.subject_teachers
  for all using (school_id = public.user_school_id() and public.user_has_permission('academics.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('academics.manage'));
create policy subject_teachers_super_admin on public.subject_teachers
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy timetables_select on public.timetables
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('academics.view'))
    or teacher_id = public.current_teacher_id()
  );
create policy timetables_write on public.timetables
  for all using (school_id = public.user_school_id() and public.user_has_permission('academics.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('academics.manage'));
create policy timetables_super_admin on public.timetables
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
