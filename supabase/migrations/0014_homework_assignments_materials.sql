-- AURAED SCHOOL — Phase 8: Homework, Assignments, Study Materials
-- Run after 0001-0013.

-- =========================================================================
-- Helper: does the CALLER (as a teacher) actually teach this
-- class+section+subject, per the subject_teachers assignments from Phase 7?
-- Used to stop a teacher creating homework/assignments/materials for a
-- class they have no real assignment to, without needing Super/School
-- Admin to police it manually. School Admin bypasses this entirely.
-- =========================================================================
create or replace function public.teacher_teaches(p_class_id uuid, p_section_id uuid, p_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subject_teachers st
    where st.teacher_id = public.current_teacher_id()
      and st.class_id = p_class_id
      and st.section_id = p_section_id
      and st.subject_id = p_subject_id
  );
$$;

grant execute on function public.teacher_teaches(uuid, uuid, uuid) to authenticated;

-- =========================================================================
-- HOMEWORK
-- =========================================================================
create table if not exists public.homework (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  attachment_path text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_homework_school_id on public.homework(school_id);
create index if not exists idx_homework_class_section on public.homework(class_id, section_id);
create index if not exists idx_homework_teacher on public.homework(teacher_id);

-- =========================================================================
-- ASSIGNMENTS + SUBMISSIONS
-- =========================================================================
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  max_marks numeric(6, 2),
  attachment_path text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assignments_school_id on public.assignments(school_id);
create index if not exists idx_assignments_class_section on public.assignments(class_id, section_id);
create index if not exists idx_assignments_teacher on public.assignments(teacher_id);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  submitted_at timestamptz,
  attachment_path text,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'late', 'graded')),
  marks_obtained numeric(6, 2),
  feedback text,
  graded_by uuid references auth.users(id) on delete set null,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create index if not exists idx_submissions_assignment on public.assignment_submissions(assignment_id);
create index if not exists idx_submissions_student on public.assignment_submissions(student_id);

-- =========================================================================
-- STUDY MATERIALS
-- =========================================================================
create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  description text,
  file_path text,
  file_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_study_materials_school_id on public.study_materials(school_id);
create index if not exists idx_study_materials_class_section on public.study_materials(class_id, section_id);

-- =========================================================================
-- updated_at + audit triggers
-- =========================================================================
drop trigger if exists trg_homework_updated_at on public.homework;
create trigger trg_homework_updated_at before update on public.homework
  for each row execute function public.set_updated_at();

drop trigger if exists trg_assignments_updated_at on public.assignments;
create trigger trg_assignments_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_submissions_updated_at on public.assignment_submissions;
create trigger trg_submissions_updated_at before update on public.assignment_submissions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_study_materials_updated_at on public.study_materials;
create trigger trg_study_materials_updated_at before update on public.study_materials
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_homework on public.homework;
create trigger trg_audit_homework
  after insert or update or delete on public.homework
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_assignments on public.assignments;
create trigger trg_audit_assignments
  after insert or update or delete on public.assignments
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_study_materials on public.study_materials;
create trigger trg_audit_study_materials
  after insert or update or delete on public.study_materials
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions, following the established per-module pattern
-- =========================================================================
insert into public.permissions (code, description) values
  ('homework.view', 'View homework'),
  ('homework.create', 'Create homework'),
  ('homework.edit', 'Edit or delete homework'),
  ('assignments.view', 'View assignments'),
  ('assignments.create', 'Create assignments'),
  ('assignments.edit', 'Edit or delete assignments'),
  ('assignments.grade', 'Grade assignment submissions'),
  ('study_materials.view', 'View study materials'),
  ('study_materials.create', 'Upload study materials'),
  ('study_materials.edit', 'Edit or delete study materials')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN'
  and p.code in (
    'homework.view', 'homework.create', 'homework.edit',
    'assignments.view', 'assignments.create', 'assignments.edit', 'assignments.grade',
    'study_materials.view', 'study_materials.create', 'study_materials.edit'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'TEACHER'
  and p.code in (
    'homework.view', 'homework.create', 'homework.edit',
    'assignments.view', 'assignments.create', 'assignments.edit', 'assignments.grade',
    'study_materials.view', 'study_materials.create', 'study_materials.edit'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('PARENT', 'STUDENT')
  and p.code in ('homework.view', 'assignments.view', 'study_materials.view')
on conflict do nothing;
