-- AURAED SCHOOL — Phase 20 fix: correctly-scoped Reports & Export access
-- Run after 0040_reports.sql.
--
-- Bug: 'reports.view' was already a permission seeded back in
-- 0001_initial_schema.sql, with broad grants to TEACHER, PARENT, STUDENT,
-- and ACCOUNTANT for reasons unrelated to this phase's bulk CSV
-- export/dashboard feature (those older grants were never wired to
-- anything in the app until now). Reusing that same code in Phase 20
-- accidentally gave those roles — including Teacher and Accountant, who
-- have real logins today — access to the Reports & Export page, meaning
-- they could bulk-export every student's PII and every employee's
-- payroll (including colleagues' salaries). This adds a distinct
-- permission, correctly scoped to School Admin only, and the app now
-- checks this one instead. The original 'reports.view'/'reports.export'
-- permissions and their Phase 1 grants are left untouched, since removing
-- them could affect something else relying on that original seed.

insert into public.permissions (code, description) values
  ('reports.manage', 'View the Reports & Export dashboard and bulk-export data as CSV')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code = 'reports.manage'
on conflict do nothing;
