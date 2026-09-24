-- AURAED SCHOOL — Phase 7: Academics (Sessions/Classes/Sections/Subjects/Timetable)
-- Run after 0001-0011.

-- =========================================================================
-- ACADEMIC SESSIONS
-- =========================================================================
create table if not exists public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, name)
);

-- Only one "current" session per school.
create unique index if not exists idx_one_current_session_per_school
  on public.academic_sessions (school_id) where is_current;

-- =========================================================================
-- CLASSES & SECTIONS
-- =========================================================================
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, name)
);

create index if not exists idx_sections_class_id on public.sections(class_id);

-- =========================================================================
-- SUBJECTS
-- =========================================================================
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, code)
);

-- =========================================================================
-- CLASS TEACHER / SUBJECT TEACHER ASSIGNMENTS
-- =========================================================================
create table if not exists public.class_teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (academic_session_id, class_id, section_id)
);

create table if not exists public.subject_teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (academic_session_id, class_id, section_id, subject_id)
);

create index if not exists idx_subject_teachers_teacher on public.subject_teachers(teacher_id);
create index if not exists idx_class_teachers_teacher on public.class_teachers(teacher_id);

-- =========================================================================
-- TIMETABLE
-- day_of_week: 0=Sunday .. 6=Saturday, matching school_settings.working_days.
-- =========================================================================
create table if not exists public.timetables (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  period_number smallint not null check (period_number > 0),
  start_time time,
  end_time time,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A class+section can't have two different things scheduled in the same
  -- period on the same day.
  unique (academic_session_id, class_id, section_id, day_of_week, period_number)
);

create index if not exists idx_timetables_school_id on public.timetables(school_id);
create index if not exists idx_timetables_class_section on public.timetables(class_id, section_id);
create index if not exists idx_timetables_teacher on public.timetables(teacher_id, day_of_week, period_number);

-- Prevent a major conflict the unique constraint above can't catch: the
-- same teacher scheduled in two different classes at the same day+period.
create or replace function public.prevent_teacher_double_booking()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.timetables t
    where t.academic_session_id = new.academic_session_id
      and t.teacher_id = new.teacher_id
      and t.day_of_week = new.day_of_week
      and t.period_number = new.period_number
      and t.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'This teacher is already scheduled for another class at this day and period';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_teacher_double_booking on public.timetables;
create trigger trg_prevent_teacher_double_booking
  before insert or update on public.timetables
  for each row execute function public.prevent_teacher_double_booking();

-- =========================================================================
-- updated_at + audit triggers
-- =========================================================================
drop trigger if exists trg_academic_sessions_updated_at on public.academic_sessions;
create trigger trg_academic_sessions_updated_at before update on public.academic_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_classes_updated_at on public.classes;
create trigger trg_classes_updated_at before update on public.classes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_sections_updated_at on public.sections;
create trigger trg_sections_updated_at before update on public.sections
  for each row execute function public.set_updated_at();

drop trigger if exists trg_subjects_updated_at on public.subjects;
create trigger trg_subjects_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();

drop trigger if exists trg_timetables_updated_at on public.timetables;
create trigger trg_timetables_updated_at before update on public.timetables
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_academic_sessions on public.academic_sessions;
create trigger trg_audit_academic_sessions
  after insert or update or delete on public.academic_sessions
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_classes on public.classes;
create trigger trg_audit_classes
  after insert or update or delete on public.classes
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_timetables on public.timetables;
create trigger trg_audit_timetables
  after insert or update or delete on public.timetables
  for each row execute function public.audit_row_change();

-- =========================================================================
-- NORMALIZATION: turn students' free-text class_name/section_name (used
-- since Phase 4, before this table structure existed) into real foreign
-- keys — WITHOUT losing or altering any data already entered. The old
-- text columns are kept as a denormalized display cache that the app keeps
-- in sync going forward, so nothing that already reads them breaks.
-- =========================================================================
alter table public.students add column if not exists class_id uuid references public.classes(id) on delete set null;
alter table public.students add column if not exists section_id uuid references public.sections(id) on delete set null;

-- Step 1: create a class row for every distinct (school_id, class_name)
-- that appears among existing students.
insert into public.classes (school_id, name)
select distinct school_id, class_name
from public.students
where class_name is not null and trim(class_name) <> ''
on conflict (school_id, name) do nothing;

-- Step 2: create a section row for every distinct (class, section_name).
insert into public.sections (school_id, class_id, name)
select distinct s.school_id, c.id, s.section_name
from public.students s
join public.classes c on c.school_id = s.school_id and c.name = s.class_name
where s.section_name is not null and trim(s.section_name) <> ''
on conflict (class_id, name) do nothing;

-- Step 3: backfill the new FK columns on students from the matching names.
update public.students s
set class_id = c.id
from public.classes c
where c.school_id = s.school_id and c.name = s.class_name and s.class_id is null;

update public.students s
set section_id = sec.id
from public.sections sec
where sec.class_id = s.class_id and sec.name = s.section_name and s.section_id is null;
