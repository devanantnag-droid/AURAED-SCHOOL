-- AURAED SCHOOL — Phase 35: Exam Seating Arrangement
-- Run after 0001-0055.
--
-- Works at the exam level, not per exam_subjects paper: real exam halls
-- seat every student sitting that exam period together (mixed across
-- classes to prevent copying), regardless of which specific subject
-- paper happens to be scheduled in which room on a given day. The
-- interleaving algorithm itself lives in the TypeScript service, since
-- it's an ordering problem better expressed there than in SQL — this
-- migration only adds the storage for rooms and the resulting
-- assignments.

create table if not exists public.exam_rooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  capacity int not null check (capacity > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_exam_rooms_school on public.exam_rooms(school_id);

create table if not exists public.exam_seating_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  room_id uuid not null references public.exam_rooms(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  seat_number int not null,
  created_at timestamptz not null default now(),
  unique (exam_id, student_id),
  unique (exam_id, room_id, seat_number)
);

create index if not exists idx_exam_seating_exam on public.exam_seating_assignments(exam_id);
create index if not exists idx_exam_seating_student on public.exam_seating_assignments(student_id);

-- =========================================================================
-- Permissions — same shape as exams.manage/exams.view, since seating is
-- part of running an exam, not a separate concern.
-- =========================================================================
insert into public.permissions (code, description) values
  ('exam_seating.manage', 'Generate and edit exam seating arrangements')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code = 'exam_seating.manage'
on conflict do nothing;

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.exam_rooms enable row level security;
alter table public.exam_seating_assignments enable row level security;

create policy exam_rooms_select on public.exam_rooms
  for select using (public.user_has_role('SUPER_ADMIN') or school_id = public.user_school_id());

create policy exam_rooms_insert on public.exam_rooms
  for insert with check (school_id = public.user_school_id() and public.user_has_permission('exam_seating.manage'));

create policy exam_rooms_update on public.exam_rooms
  for update using (school_id = public.user_school_id() and public.user_has_permission('exam_seating.manage'));

create policy exam_rooms_delete on public.exam_rooms
  for delete using (school_id = public.user_school_id() and public.user_has_permission('exam_seating.manage'));

-- Seating: School Admin (and staff who manage exams) see every
-- assignment at their school. A student can see their own seat, and a
-- parent can see their own child's seat — this is exactly the kind of
-- thing a student/parent legitimately needs to know ahead of an exam.
create policy exam_seating_select on public.exam_seating_assignments
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('exam_seating.manage'))
    or student_id = public.current_student_id()
    or public.is_parent_of(student_id)
  );

create policy exam_seating_insert on public.exam_seating_assignments
  for insert with check (school_id = public.user_school_id() and public.user_has_permission('exam_seating.manage'));

create policy exam_seating_delete on public.exam_seating_assignments
  for delete using (school_id = public.user_school_id() and public.user_has_permission('exam_seating.manage'));
