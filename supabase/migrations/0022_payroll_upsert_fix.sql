-- AURAED SCHOOL — Phase 11 fix: salary_structures upsert target
-- Run after 0021_payroll_rls.sql.
--
-- Bug: idx_salary_structures_one_per_teacher/staff were PARTIAL unique
-- indexes (`where teacher_id is not null`). Postgres's ON CONFLICT clause
-- can't infer a partial index as its target unless the same WHERE clause
-- is repeated in the conflict clause itself — which supabase-js's
-- .upsert({ onConflict: 'teacher_id' }) doesn't do. A plain (non-partial)
-- unique constraint behaves identically for our purposes here: Postgres
-- already treats every NULL as distinct from every other NULL, so a plain
-- unique(teacher_id) still allows unlimited staff-only rows (teacher_id
-- null) — it just ALSO works as a normal ON CONFLICT target.

drop index if exists public.idx_salary_structures_one_per_teacher;
drop index if exists public.idx_salary_structures_one_per_staff;

alter table public.salary_structures
  add constraint uq_salary_structures_teacher unique (teacher_id);
alter table public.salary_structures
  add constraint uq_salary_structures_staff unique (staff_id);
