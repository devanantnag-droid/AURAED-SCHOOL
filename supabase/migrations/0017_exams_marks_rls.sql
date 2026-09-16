-- AURAED SCHOOL — Phase 9: RLS for exams/exam_subjects/marks
-- Run after 0016_exams_marks.sql.

alter table public.exams enable row level security;
alter table public.exam_subjects enable row level security;
alter table public.marks enable row level security;

-- =========================================================================
-- EXAMS — scheduling is an admin responsibility; everyone with exams.view
-- (teachers, and eventually parents/students) can see the schedule.
-- =========================================================================
create policy exams_select on public.exams
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('exams.view'))
  );

create policy exams_write on public.exams
  for all
  using (school_id = public.user_school_id() and public.user_has_permission('exams.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('exams.manage'));

create policy exams_super_admin on public.exams
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- EXAM SUBJECTS
-- =========================================================================
create policy exam_subjects_select on public.exam_subjects
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('exams.view'))
  );

create policy exam_subjects_write on public.exam_subjects
  for all
  using (school_id = public.user_school_id() and public.user_has_permission('exams.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('exams.manage'));

create policy exam_subjects_super_admin on public.exam_subjects
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- MARKS
-- A teacher may only enter/edit marks for an exam_subject whose
-- class+section+subject they actually teach (per Phase 7/8's
-- teacher_teaches() pattern) — resolved by joining back to exam_subjects.
-- The "not finalized" lock is enforced by the trigger in 0016, not here;
-- RLS handles WHO can write, the trigger handles WHEN.
-- =========================================================================
create policy marks_select on public.marks
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('marks.view'))
  );

create policy marks_write on public.marks
  for all
  using (
    school_id = public.user_school_id()
    and public.user_has_permission('marks.enter')
    and (
      public.user_has_role('SCHOOL_ADMIN')
      or exists (
        select 1 from public.exam_subjects es
        where es.id = marks.exam_subject_id
          and public.teacher_teaches(es.class_id, es.section_id, es.subject_id)
      )
    )
  )
  with check (
    school_id = public.user_school_id()
    and public.user_has_permission('marks.enter')
    and (
      public.user_has_role('SCHOOL_ADMIN')
      or exists (
        select 1 from public.exam_subjects es
        where es.id = marks.exam_subject_id
          and public.teacher_teaches(es.class_id, es.section_id, es.subject_id)
      )
    )
  );

create policy marks_super_admin on public.marks
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
