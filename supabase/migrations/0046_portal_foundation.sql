-- AURAED SCHOOL — Phase 24: Parent/Student Portal — foundation
-- Run after 0001-0045.
--
-- students never got a user_id column (unlike parents/teachers/staff,
-- which have had one since Phase 4) — there was no portal to link it to
-- until now. parents.user_id and the parent_students linking table
-- already existed from Phase 4, just never wired to an actual login.

alter table public.students add column if not exists user_id uuid references auth.users(id) on delete set null;
create unique index if not exists idx_students_user_id on public.students(user_id) where user_id is not null;

-- =========================================================================
-- current_student_id() — same shape as Phase 6's current_teacher_id().
-- =========================================================================
create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.students
  where user_id = auth.uid() and school_id = public.user_school_id();
$$;

grant execute on function public.current_student_id() to authenticated;

-- =========================================================================
-- is_parent_of(student_id) — true if the logged-in user is a parent
-- record linked to that student via parent_students.
-- =========================================================================
create or replace function public.is_parent_of(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.parents p
    join public.parent_students ps on ps.parent_id = p.id
    where p.user_id = auth.uid() and ps.student_id = p_student_id
  );
$$;

grant execute on function public.is_parent_of(uuid) to authenticated;

-- A parent's own list of linked children — used by the portal to build a
-- child-switcher when a parent has more than one child at the school.
create or replace function public.my_children()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select ps.student_id from public.parents p
  join public.parent_students ps on ps.parent_id = p.id
  where p.user_id = auth.uid();
$$;

grant execute on function public.my_children() to authenticated;

-- =========================================================================
-- SELF-VIEW POLICIES — a student sees their own data; a parent sees
-- their linked children's data. Every policy below is ADDITIVE (existing
-- staff-facing policies from earlier phases are untouched) and strictly
-- read-only — nothing here grants a student or parent the ability to
-- write to any of these tables.
-- =========================================================================

-- STUDENTS — a student can see their own row; a parent can see their
-- children's rows. (Staff/admin visibility already existed since Phase 4.)
create policy students_select_self on public.students
  for select using (id = public.current_student_id() or public.is_parent_of(id));

-- STUDENT ATTENDANCE (Phase 5)
create policy student_attendance_select_self on public.student_attendance
  for select using (student_id = public.current_student_id() or public.is_parent_of(student_id));

-- HOMEWORK / ASSIGNMENTS / STUDY MATERIALS (Phase 8) — visible if it's
-- for the student's own class+section.
create policy homework_select_self on public.homework
  for select using (
    exists (
      select 1 from public.students s
      where (s.id = public.current_student_id() or public.is_parent_of(s.id))
        and s.class_id = homework.class_id and s.section_id = homework.section_id
    )
  );

create policy assignments_select_self on public.assignments
  for select using (
    exists (
      select 1 from public.students s
      where (s.id = public.current_student_id() or public.is_parent_of(s.id))
        and s.class_id = assignments.class_id and s.section_id = assignments.section_id
    )
  );

create policy assignment_submissions_select_self on public.assignment_submissions
  for select using (student_id = public.current_student_id() or public.is_parent_of(student_id));

create policy study_materials_select_self on public.study_materials
  for select using (
    exists (
      select 1 from public.students s
      where (s.id = public.current_student_id() or public.is_parent_of(s.id))
        and s.class_id = study_materials.class_id and s.section_id = study_materials.section_id
    )
  );

-- MARKS / EXAM SUBJECTS (Phase 9) — a student/parent can see the marks
-- row itself, and the exam_subjects row it references (for max marks,
-- subject name) so the report-card-style view can render.
create policy marks_select_self on public.marks
  for select using (student_id = public.current_student_id() or public.is_parent_of(student_id));

create policy exam_subjects_select_self on public.exam_subjects
  for select using (
    exists (
      select 1 from public.students s
      where (s.id = public.current_student_id() or public.is_parent_of(s.id))
        and s.class_id = exam_subjects.class_id and s.section_id = exam_subjects.section_id
    )
  );

-- STUDENT FEES / PAYMENTS (Phase 10) — view only, never write.
create policy student_fees_select_self on public.student_fees
  for select using (student_id = public.current_student_id() or public.is_parent_of(student_id));

create policy payments_select_self on public.payments
  for select using (
    exists (
      select 1 from public.student_fees sf
      where sf.id = payments.student_fee_id
        and (sf.student_id = public.current_student_id() or public.is_parent_of(sf.student_id))
    )
  );

-- ISSUED CERTIFICATES (Phase 16)
create policy issued_certificates_select_self on public.issued_certificates
  for select using (student_id = public.current_student_id() or public.is_parent_of(student_id));

-- BOOK ISSUES (Phase 12) — a student's own borrowing history.
create policy book_issues_select_self on public.book_issues
  for select using (student_id = public.current_student_id() or public.is_parent_of(student_id));
