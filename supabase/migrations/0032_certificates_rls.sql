-- AURAED SCHOOL — Phase 16: RLS for certificate_templates/issued_certificates
-- Run after 0031_certificates.sql.

alter table public.certificate_templates enable row level security;
alter table public.issued_certificates enable row level security;

create policy certificate_templates_select on public.certificate_templates
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('certificates.view')));
create policy certificate_templates_write on public.certificate_templates
  for all using (school_id = public.user_school_id() and public.user_has_permission('certificates.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('certificates.manage'));
create policy certificate_templates_super_admin on public.certificate_templates
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy issued_certificates_select on public.issued_certificates
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('certificates.view')));
create policy issued_certificates_write on public.issued_certificates
  for all using (school_id = public.user_school_id() and public.user_has_permission('certificates.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('certificates.manage'));
create policy issued_certificates_super_admin on public.issued_certificates
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
