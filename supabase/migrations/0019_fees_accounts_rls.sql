-- AURAED SCHOOL — Phase 10: RLS for fees/payments/accounts
-- Run after 0018_fees_accounts.sql.

alter table public.fee_categories enable row level security;
alter table public.fee_structures enable row level security;
alter table public.student_fees enable row level security;
alter table public.payments enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

-- =========================================================================
-- FEE CATEGORIES / STRUCTURES — reuse the fees.* permissions seeded in
-- Phase 1 (already granted to SCHOOL_ADMIN and ACCOUNTANT).
-- =========================================================================
create policy fee_categories_select on public.fee_categories
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('fees.view')));
create policy fee_categories_insert on public.fee_categories
  for insert with check (school_id = public.user_school_id() and public.user_has_permission('fees.create'));
create policy fee_categories_update on public.fee_categories
  for update using (school_id = public.user_school_id() and public.user_has_permission('fees.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('fees.edit'));
create policy fee_categories_delete on public.fee_categories
  for delete using (school_id = public.user_school_id() and public.user_has_permission('fees.delete'));
create policy fee_categories_super_admin on public.fee_categories
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy fee_structures_select on public.fee_structures
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('fees.view')));
create policy fee_structures_insert on public.fee_structures
  for insert with check (school_id = public.user_school_id() and public.user_has_permission('fees.create'));
create policy fee_structures_update on public.fee_structures
  for update using (school_id = public.user_school_id() and public.user_has_permission('fees.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('fees.edit'));
create policy fee_structures_delete on public.fee_structures
  for delete using (school_id = public.user_school_id() and public.user_has_permission('fees.delete'));
create policy fee_structures_super_admin on public.fee_structures
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- STUDENT FEES
-- =========================================================================
create policy student_fees_select on public.student_fees
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('fees.view')));
create policy student_fees_insert on public.student_fees
  for insert with check (school_id = public.user_school_id() and public.user_has_permission('fees.create'));
create policy student_fees_update on public.student_fees
  for update using (school_id = public.user_school_id() and public.user_has_permission('fees.edit'))
  with check (school_id = public.user_school_id() and public.user_has_permission('fees.edit'));
create policy student_fees_delete on public.student_fees
  for delete using (school_id = public.user_school_id() and public.user_has_permission('fees.delete'));
create policy student_fees_super_admin on public.student_fees
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- PAYMENTS — insert/view only; no update/delete policy for anyone but
-- Super Admin, matching the audit_logs pattern (a payment record shouldn't
-- be silently edited — a refund should be its own new payment row with a
-- negative-adjustment convention or status='refunded', not an edit).
-- =========================================================================
create policy payments_select on public.payments
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('payments.view')));
create policy payments_insert on public.payments
  for insert with check (school_id = public.user_school_id() and public.user_has_permission('payments.create'));
create policy payments_super_admin on public.payments
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- EXPENSE CATEGORIES / EXPENSES
-- =========================================================================
create policy expense_categories_select on public.expense_categories
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('accounts.view')));
create policy expense_categories_write on public.expense_categories
  for all using (school_id = public.user_school_id() and public.user_has_permission('accounts.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('accounts.manage'));
create policy expense_categories_super_admin on public.expense_categories
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy expenses_select on public.expenses
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('accounts.view')));
create policy expenses_write on public.expenses
  for all using (school_id = public.user_school_id() and public.user_has_permission('accounts.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('accounts.manage'));
create policy expenses_super_admin on public.expenses
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
