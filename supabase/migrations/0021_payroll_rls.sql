-- AURAED SCHOOL — Phase 11: RLS for salary_structures/payslips
-- Run after 0020_payroll.sql.

alter table public.salary_structures enable row level security;
alter table public.payslips enable row level security;

-- =========================================================================
-- SALARY STRUCTURES — admin/HR only, no self-view (an employee doesn't
-- need to see the underlying structure, only their finalized payslips).
-- =========================================================================
create policy salary_structures_select on public.salary_structures
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('payroll.view')));
create policy salary_structures_write on public.salary_structures
  for all using (school_id = public.user_school_id() and public.user_has_permission('payroll.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('payroll.manage'));
create policy salary_structures_super_admin on public.salary_structures
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- PAYSLIPS — admin/HR/accountant can view all; a teacher can view their
-- own (self-service, like Phase 6's punch records). Staff self-view isn't
-- wired up yet since there's no staff login-invite flow (same limitation
-- pattern noted in earlier phases) — a staff_id-based self-view policy can
-- be added once that flow exists.
-- =========================================================================
create policy payslips_select on public.payslips
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('payroll.view'))
    or teacher_id = public.current_teacher_id()
  );
create policy payslips_write on public.payslips
  for all using (school_id = public.user_school_id() and public.user_has_permission('payroll.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('payroll.manage'));
create policy payslips_super_admin on public.payslips
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
