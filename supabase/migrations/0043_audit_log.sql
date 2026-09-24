-- AURAED SCHOOL — Phase 22: Audit Log UI + final security pass
-- Run after 0001-0042.
--
-- Bug found during this phase's audit: audit_logs_select (from Phase 1)
-- only checked school_id membership, with no permission check at all —
-- meaning ANY logged-in user at a school (a Teacher, Receptionist,
-- Librarian, anyone) could already query the full audit_logs table
-- directly and see every change ever made at their school, including
-- payroll/salary edits and other people's record history. No UI
-- currently surfaces this broadly, but the underlying access was already
-- there. This tightens it to require a real permission, matching the
-- pattern used by every other table in the app, before this phase adds
-- an actual Audit Log page.

drop policy if exists audit_logs_select on public.audit_logs;

create policy audit_logs_select on public.audit_logs
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('audit.view'))
  );

-- audit_logs_insert (from Phase 1) is untouched — every school member
-- needs to keep triggering inserts via their own actions (the
-- audit_row_change() trigger runs as part of their normal writes), this
-- only restricts who can READ the log afterward.

insert into public.permissions (code, description) values
  ('audit.view', 'View the audit log of changes made across the school''s data')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code = 'audit.view'
on conflict do nothing;
