-- AURAED SCHOOL — Phase 15: RLS for admissions/admission_documents
-- Run after 0029_admissions.sql.

alter table public.admissions enable row level security;
alter table public.admission_documents enable row level security;

create policy admissions_select on public.admissions
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('admissions.view')));
create policy admissions_write on public.admissions
  for all using (school_id = public.user_school_id() and public.user_has_permission('admissions.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('admissions.manage'));
create policy admissions_super_admin on public.admissions
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy admission_documents_select on public.admission_documents
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('admissions.view')));
create policy admission_documents_write on public.admission_documents
  for all using (school_id = public.user_school_id() and public.user_has_permission('admissions.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('admissions.manage'));
create policy admission_documents_super_admin on public.admission_documents
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
