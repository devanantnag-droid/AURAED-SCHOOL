-- AURAED SCHOOL — Phase 4: Students, Parents, Teachers, Staff
-- Run after 0001-0005.
--
-- Note on class/section: full Academic Sessions/Classes/Sections/Subjects
-- structure arrives in Phase 7. To avoid building throwaway foreign keys
-- now, students carry free-text `class_name`/`section_name` for this phase;
-- Phase 7 will add a migration to normalize these into proper tables and
-- backfill the references, without losing any data entered now.

-- =========================================================================
-- STUDENTS
-- =========================================================================
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  admission_number text not null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  blood_group text,
  photo_url text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  admission_date date not null default current_date,
  class_name text,
  section_name text,
  roll_number text,
  academic_session text,
  house text,
  status text not null default 'active' check (status in ('active', 'inactive', 'alumni', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, admission_number)
);

create index if not exists idx_students_school_id on public.students(school_id);
create index if not exists idx_students_status on public.students(school_id, status);

-- =========================================================================
-- PARENTS
-- =========================================================================
create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  -- Optional link to a login account (a parent may or may not have portal access yet).
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  relationship text,
  phone text,
  email text,
  address text,
  occupation text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_parents_school_id on public.parents(school_id);

create table if not exists public.parent_students (
  parent_id uuid not null references public.parents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (parent_id, student_id)
);

-- =========================================================================
-- TEACHERS
-- =========================================================================
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  employee_id text not null,
  full_name text not null,
  gender text check (gender in ('male', 'female', 'other')),
  date_of_birth date,
  phone text,
  email text,
  address text,
  qualification text,
  joining_date date not null default current_date,
  department text,
  designation text,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, employee_id)
);

create index if not exists idx_teachers_school_id on public.teachers(school_id);

-- =========================================================================
-- STAFF (non-teaching)
-- =========================================================================
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  employee_id text not null,
  full_name text not null,
  role_title text,
  department text,
  phone text,
  email text,
  joining_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, employee_id)
);

create index if not exists idx_staff_school_id on public.staff(school_id);

-- =========================================================================
-- updated_at + audit triggers, reusing Phase 2's generic functions
-- =========================================================================
drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at before update on public.students
  for each row execute function public.set_updated_at();

drop trigger if exists trg_parents_updated_at on public.parents;
create trigger trg_parents_updated_at before update on public.parents
  for each row execute function public.set_updated_at();

drop trigger if exists trg_teachers_updated_at on public.teachers;
create trigger trg_teachers_updated_at before update on public.teachers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_staff_updated_at on public.staff;
create trigger trg_staff_updated_at before update on public.staff
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_students on public.students;
create trigger trg_audit_students
  after insert or update or delete on public.students
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_parents on public.parents;
create trigger trg_audit_parents
  after insert or update or delete on public.parents
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_teachers on public.teachers;
create trigger trg_audit_teachers
  after insert or update or delete on public.teachers
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_staff on public.staff;
create trigger trg_audit_staff
  after insert or update or delete on public.staff
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permission codes for this phase's modules, following the same
-- pattern as students.* from Phase 1.
-- =========================================================================
insert into public.permissions (code, description) values
  ('teachers.view', 'View teachers'),
  ('teachers.create', 'Create teachers'),
  ('teachers.edit', 'Edit teachers'),
  ('teachers.delete', 'Delete/archive teachers'),
  ('parents.view', 'View parents'),
  ('parents.create', 'Create parents'),
  ('parents.edit', 'Edit parents'),
  ('parents.delete', 'Delete/archive parents'),
  ('staff.view', 'View staff'),
  ('staff.create', 'Create staff'),
  ('staff.edit', 'Edit staff'),
  ('staff.delete', 'Delete/archive staff')
on conflict (code) do nothing;

-- SCHOOL_ADMIN gets full rights on all four new modules.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN'
  and p.code in (
    'teachers.view', 'teachers.create', 'teachers.edit', 'teachers.delete',
    'parents.view', 'parents.create', 'parents.edit', 'parents.delete',
    'staff.view', 'staff.create', 'staff.edit', 'staff.delete'
  )
on conflict do nothing;

-- HR_MANAGER manages staff and can view teachers.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'HR_MANAGER'
  and p.code in ('staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'teachers.view')
on conflict do nothing;

-- RECEPTIONIST can view students/parents/teachers for front-desk lookups.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'RECEPTIONIST' and p.code in ('students.view', 'parents.view', 'teachers.view')
on conflict do nothing;
