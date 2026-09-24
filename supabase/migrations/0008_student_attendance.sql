-- AURAED SCHOOL — Phase 5: Student Attendance
-- Run after 0001-0007.
--
-- Note: class/section are denormalized text columns here (copied from the
-- student's current class_name/section_name at mark time), matching the
-- same simplification students.class_name/section_name use until Phase 7
-- introduces real classes/sections tables. Marking is per calendar date,
-- one row per student per day — this both matches spec §17 and gives a
-- natural place to enforce "only one attendance record per student per day".

create table if not exists public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_name text,
  section_name text,
  attendance_date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'leave', 'holiday')),
  remarks text,
  marked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, attendance_date)
);

create index if not exists idx_student_attendance_school_id on public.student_attendance(school_id);
create index if not exists idx_student_attendance_student_id on public.student_attendance(student_id);
create index if not exists idx_student_attendance_date on public.student_attendance(school_id, attendance_date);
create index if not exists idx_student_attendance_class on public.student_attendance(school_id, class_name, section_name, attendance_date);

drop trigger if exists trg_student_attendance_updated_at on public.student_attendance;
create trigger trg_student_attendance_updated_at before update on public.student_attendance
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_student_attendance on public.student_attendance;
create trigger trg_audit_student_attendance
  after insert or update or delete on public.student_attendance
  for each row execute function public.audit_row_change();
