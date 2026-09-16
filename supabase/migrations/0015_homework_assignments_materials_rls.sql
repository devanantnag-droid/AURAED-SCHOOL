-- AURAED SCHOOL — Phase 8: RLS for homework/assignments/study materials + Storage
-- Run after 0014_homework_assignments_materials.sql.

alter table public.homework enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.study_materials enable row level security;

-- =========================================================================
-- HOMEWORK
-- =========================================================================
create policy homework_select on public.homework
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('homework.view'))
  );

create policy homework_insert on public.homework
  for insert
  with check (
    school_id = public.user_school_id()
    and public.user_has_permission('homework.create')
    and (
      public.user_has_role('SCHOOL_ADMIN')
      or (teacher_id = public.current_teacher_id() and public.teacher_teaches(class_id, section_id, subject_id))
    )
  );

create policy homework_update on public.homework
  for update
  using (
    school_id = public.user_school_id()
    and public.user_has_permission('homework.edit')
    and (public.user_has_role('SCHOOL_ADMIN') or teacher_id = public.current_teacher_id())
  )
  with check (
    school_id = public.user_school_id()
    and public.user_has_permission('homework.edit')
    and (public.user_has_role('SCHOOL_ADMIN') or teacher_id = public.current_teacher_id())
  );

create policy homework_delete on public.homework
  for delete
  using (
    school_id = public.user_school_id()
    and public.user_has_permission('homework.edit')
    and (public.user_has_role('SCHOOL_ADMIN') or teacher_id = public.current_teacher_id())
  );

create policy homework_super_admin on public.homework
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- ASSIGNMENTS
-- =========================================================================
create policy assignments_select on public.assignments
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('assignments.view'))
  );

create policy assignments_insert on public.assignments
  for insert
  with check (
    school_id = public.user_school_id()
    and public.user_has_permission('assignments.create')
    and (
      public.user_has_role('SCHOOL_ADMIN')
      or (teacher_id = public.current_teacher_id() and public.teacher_teaches(class_id, section_id, subject_id))
    )
  );

create policy assignments_update on public.assignments
  for update
  using (
    school_id = public.user_school_id()
    and public.user_has_permission('assignments.edit')
    and (public.user_has_role('SCHOOL_ADMIN') or teacher_id = public.current_teacher_id())
  )
  with check (
    school_id = public.user_school_id()
    and public.user_has_permission('assignments.edit')
    and (public.user_has_role('SCHOOL_ADMIN') or teacher_id = public.current_teacher_id())
  );

create policy assignments_delete on public.assignments
  for delete
  using (
    school_id = public.user_school_id()
    and public.user_has_permission('assignments.edit')
    and (public.user_has_role('SCHOOL_ADMIN') or teacher_id = public.current_teacher_id())
  );

create policy assignments_super_admin on public.assignments
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- ASSIGNMENT SUBMISSIONS
-- Known limitation (same as attendance/subscription phases): there's no
-- student self-service portal login yet, so students can't submit their
-- own work through RLS-protected self-access. For now, submissions are
-- entered/graded by the teacher who owns the assignment or School Admin.
-- A real student-submission policy (student_id resolves to the caller's
-- own student record) can be added once student portal accounts exist.
-- =========================================================================
create policy submissions_select on public.assignment_submissions
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (
      school_id = public.user_school_id()
      and public.user_has_permission('assignments.view')
      and (
        public.user_has_role('SCHOOL_ADMIN')
        or exists (select 1 from public.assignments a where a.id = assignment_submissions.assignment_id and a.teacher_id = public.current_teacher_id())
      )
    )
  );

create policy submissions_write on public.assignment_submissions
  for all
  using (
    school_id = public.user_school_id()
    and public.user_has_permission('assignments.grade')
    and (
      public.user_has_role('SCHOOL_ADMIN')
      or exists (select 1 from public.assignments a where a.id = assignment_submissions.assignment_id and a.teacher_id = public.current_teacher_id())
    )
  )
  with check (
    school_id = public.user_school_id()
    and public.user_has_permission('assignments.grade')
    and (
      public.user_has_role('SCHOOL_ADMIN')
      or exists (select 1 from public.assignments a where a.id = assignment_submissions.assignment_id and a.teacher_id = public.current_teacher_id())
    )
  );

create policy submissions_super_admin on public.assignment_submissions
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- STUDY MATERIALS
-- =========================================================================
create policy study_materials_select on public.study_materials
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('study_materials.view'))
  );

create policy study_materials_insert on public.study_materials
  for insert
  with check (
    school_id = public.user_school_id()
    and public.user_has_permission('study_materials.create')
    and (
      public.user_has_role('SCHOOL_ADMIN')
      or (teacher_id = public.current_teacher_id() and public.teacher_teaches(class_id, section_id, subject_id))
    )
  );

create policy study_materials_update on public.study_materials
  for update
  using (
    school_id = public.user_school_id()
    and public.user_has_permission('study_materials.edit')
    and (public.user_has_role('SCHOOL_ADMIN') or teacher_id = public.current_teacher_id())
  )
  with check (
    school_id = public.user_school_id()
    and public.user_has_permission('study_materials.edit')
    and (public.user_has_role('SCHOOL_ADMIN') or teacher_id = public.current_teacher_id())
  );

create policy study_materials_delete on public.study_materials
  for delete
  using (
    school_id = public.user_school_id()
    and public.user_has_permission('study_materials.edit')
    and (public.user_has_role('SCHOOL_ADMIN') or teacher_id = public.current_teacher_id())
  );

create policy study_materials_super_admin on public.study_materials
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- STORAGE: buckets for this phase's attachments. Private (not public) —
-- access is granted per-request via short-lived signed URLs, never a
-- permanent public link.
-- =========================================================================
insert into storage.buckets (id, name, public)
values
  ('homework', 'homework', false),
  ('assignments', 'assignments', false),
  ('study-materials', 'study-materials', false)
on conflict (id) do nothing;

-- Path convention enforced by these policies: {school_id}/{filename}.
-- storage.foldername(name) splits the object path into an array of folder
-- segments; [1] is the first segment, which must equal the caller's school.
create policy school_files_select on storage.objects
  for select using (
    bucket_id in ('homework', 'assignments', 'study-materials')
    and (
      public.user_has_role('SUPER_ADMIN')
      or (storage.foldername(name))[1] = public.user_school_id()::text
    )
  );

create policy school_files_insert on storage.objects
  for insert
  with check (
    bucket_id in ('homework', 'assignments', 'study-materials')
    and (storage.foldername(name))[1] = public.user_school_id()::text
  );

create policy school_files_update on storage.objects
  for update
  using (bucket_id in ('homework', 'assignments', 'study-materials') and (storage.foldername(name))[1] = public.user_school_id()::text)
  with check (bucket_id in ('homework', 'assignments', 'study-materials') and (storage.foldername(name))[1] = public.user_school_id()::text);

create policy school_files_delete on storage.objects
  for delete using (
    bucket_id in ('homework', 'assignments', 'study-materials')
    and (storage.foldername(name))[1] = public.user_school_id()::text
  );
