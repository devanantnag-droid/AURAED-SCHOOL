-- AURAED SCHOOL — Phase 20: Reports & Export
-- Run after 0001-0039.
--
-- No new tables this phase — reports and exports work entirely off data
-- that already exists across every prior phase's tables. This migration
-- only adds the permission gating access to the Reports page. Kept tight
-- (School Admin only) given bulk CSV export of student/fee/payroll data
-- is a meaningfully more sensitive action than viewing one record at a
-- time in the app.

insert into public.permissions (code, description) values
  ('reports.view', 'View summary dashboards and export data as CSV')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code = 'reports.view'
on conflict do nothing;
