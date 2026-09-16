-- AURAED SCHOOL — Phase 9: Exams, Marks, Results, Report Cards
-- Run after 0001-0015.

-- =========================================================================
-- EXAMS
-- =========================================================================
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  name text not null,
  exam_type text not null default 'unit_test'
    check (exam_type in ('unit_test', 'mid_term', 'final', 'monthly_test', 'internal_assessment')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exams_school_id on public.exams(school_id);

-- =========================================================================
-- EXAM SUBJECTS — one row per exam x class x section x subject, carrying
-- the max/passing marks and schedule for that specific paper. Marks are
-- entered against this row, and it's also the unit that gets "finalized"
-- (locked) once results are ready — matching spec §24's "lock finalized
-- results" requirement.
-- =========================================================================
create table if not exists public.exam_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  exam_date date,
  max_marks numeric(6, 2) not null default 100,
  passing_marks numeric(6, 2) not null default 33,
  room text,
  is_finalized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, class_id, section_id, subject_id)
);

create index if not exists idx_exam_subjects_school_id on public.exam_subjects(school_id);
create index if not exists idx_exam_subjects_exam on public.exam_subjects(exam_id);
create index if not exists idx_exam_subjects_class_section on public.exam_subjects(class_id, section_id);

-- =========================================================================
-- MARKS
-- =========================================================================
create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  exam_subject_id uuid not null references public.exam_subjects(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  marks_obtained numeric(6, 2),
  grade text,
  remarks text,
  entered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_subject_id, student_id)
);

create index if not exists idx_marks_school_id on public.marks(school_id);
create index if not exists idx_marks_exam_subject on public.marks(exam_subject_id);
create index if not exists idx_marks_student on public.marks(student_id);

-- Reject entering/editing marks for an exam_subject that's already
-- finalized — the app should have already blocked this in the UI via
-- is_finalized, but this makes it impossible to bypass either way, short
-- of a Super Admin/School Admin action that explicitly un-finalizes first.
create or replace function public.enforce_marks_not_finalized()
returns trigger
language plpgsql
as $$
declare
  v_finalized boolean;
begin
  select is_finalized into v_finalized from public.exam_subjects where id = new.exam_subject_id;
  if v_finalized and not public.user_has_permission('marks.finalize') then
    raise exception 'This exam subject''s results are finalized and locked. Ask your School Admin to unlock them first.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_marks_not_finalized on public.marks;
create trigger trg_enforce_marks_not_finalized
  before insert or update on public.marks
  for each row execute function public.enforce_marks_not_finalized();

-- =========================================================================
-- updated_at + audit triggers
-- =========================================================================
drop trigger if exists trg_exams_updated_at on public.exams;
create trigger trg_exams_updated_at before update on public.exams
  for each row execute function public.set_updated_at();

drop trigger if exists trg_exam_subjects_updated_at on public.exam_subjects;
create trigger trg_exam_subjects_updated_at before update on public.exam_subjects
  for each row execute function public.set_updated_at();

drop trigger if exists trg_marks_updated_at on public.marks;
create trigger trg_marks_updated_at before update on public.marks
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_exams on public.exams;
create trigger trg_audit_exams
  after insert or update or delete on public.exams
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_exam_subjects on public.exam_subjects;
create trigger trg_audit_exam_subjects
  after insert or update or delete on public.exam_subjects
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_marks on public.marks;
create trigger trg_audit_marks
  after insert or update or delete on public.marks
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('exams.view', 'View exams and schedules'),
  ('exams.manage', 'Create/edit exams and exam subjects'),
  ('marks.view', 'View marks and results'),
  ('marks.enter', 'Enter marks for subjects taught'),
  ('marks.finalize', 'Finalize/unfinalize results and override locked marks')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN'
  and p.code in ('exams.view', 'exams.manage', 'marks.view', 'marks.enter', 'marks.finalize')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'TEACHER' and p.code in ('exams.view', 'marks.view', 'marks.enter')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('PARENT', 'STUDENT') and p.code in ('exams.view', 'marks.view')
on conflict do nothing;
