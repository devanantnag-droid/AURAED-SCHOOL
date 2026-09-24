-- AURAED SCHOOL — Phase 1: Row Level Security
-- These helper functions are the ONLY place authorization logic should live
-- on the database side. Every later migration's policies should call them
-- rather than re-deriving role/school_id logic inline.

-- =========================================================================
-- HELPER FUNCTIONS (security definer: they read user_roles/profiles on
-- behalf of the caller without needing broad SELECT grants on those tables,
-- and cannot be tricked by a caller since they only ever read the caller's
-- own auth.uid()).
-- =========================================================================

create or replace function public.user_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

create or replace function public.user_has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.name = role_name
  );
$$;

create or replace function public.user_has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid() and p.code = permission_code
  );
$$;

-- Is the caller a member (any role) of the given school?
create or replace function public.user_in_school(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_school_id() = target_school_id;
$$;

grant execute on function public.user_school_id() to authenticated;
grant execute on function public.user_has_role(text) to authenticated;
grant execute on function public.user_has_permission(text) to authenticated;
grant execute on function public.user_in_school(uuid) to authenticated;

-- =========================================================================
-- ENABLE RLS
-- =========================================================================
alter table public.schools enable row level security;
alter table public.school_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

-- =========================================================================
-- SCHOOLS
-- Super Admin: full access. Members of a school: read their own school only.
-- Only Super Admin can create/update/delete school records in Phase 1
-- (School Admin self-service editing of their own school profile is added
-- in Phase 2's onboarding/settings work, as a narrower UPDATE policy).
-- =========================================================================
create policy schools_select_own_or_platform on public.schools
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or id = public.user_school_id()
  );

create policy schools_all_super_admin on public.schools
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- SCHOOL SETTINGS
-- =========================================================================
create policy school_settings_select on public.school_settings
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or school_id = public.user_school_id()
  );

create policy school_settings_write_admin on public.school_settings
  for all
  using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN'))
  )
  with check (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN'))
  );

-- =========================================================================
-- PROFILES
-- Everyone can read/update their own profile. School staff with the
-- SCHOOL_ADMIN role can read profiles within their own school (needed for
-- staff directories in later phases). Super Admin reads all.
-- No one can change their own school_id or status via the client — that's
-- reserved for Super Admin / School Admin flows, enforced by the narrower
-- with-check below (a normal user's own-row policy omits those columns'
-- ability to change by relying on application code + a future column-level
-- trigger in Phase 2; for Phase 1 we keep the policy simple and add the
-- trigger guard now).
-- =========================================================================
create policy profiles_select on public.profiles
  for select
  using (
    id = auth.uid()
    or public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN'))
  );

create policy profiles_update_own on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_all_super_admin on public.profiles
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

-- Prevent a user from escalating themselves by changing their own school_id
-- or status through the "update own profile" policy above.
create or replace function public.prevent_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if public.user_has_role('SUPER_ADMIN') then
    return new; -- Super Admin may reassign school_id/status deliberately.
  end if;

  if new.id = auth.uid() and (new.school_id is distinct from old.school_id
      or new.status is distinct from old.status) then
    raise exception 'You cannot change your own school_id or status';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_self_escalation on public.profiles;
create trigger trg_prevent_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_escalation();

-- =========================================================================
-- ROLES / PERMISSIONS (catalog tables — readable by any authenticated user
-- so the client can render permission-gated UI; writable only by Super Admin)
-- =========================================================================
create policy roles_select_all on public.roles
  for select using (auth.role() = 'authenticated');

create policy roles_write_super_admin on public.roles
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

create policy permissions_select_all on public.permissions
  for select using (auth.role() = 'authenticated');

create policy permissions_write_super_admin on public.permissions
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

create policy role_permissions_select_all on public.role_permissions
  for select using (auth.role() = 'authenticated');

create policy role_permissions_write_super_admin on public.role_permissions
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- USER_ROLES
-- A user can see their own role assignments (needed to resolve permissions
-- client-side). School Admin can see/manage assignments within their own
-- school. Super Admin can see/manage everything.
-- =========================================================================
create policy user_roles_select_own_or_admin on public.user_roles
  for select
  using (
    user_id = auth.uid()
    or public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN'))
  );

create policy user_roles_write_admin on public.user_roles
  for all
  using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN'))
  )
  with check (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN'))
  );

-- =========================================================================
-- AUDIT LOGS
-- Insert-only from the app's perspective; never updatable/deletable by
-- normal users. School Admin reads their school's logs; Super Admin reads
-- everything. Inserts happen via SECURITY DEFINER functions added per
-- feature in later phases (so a client can't forge old_data/new_data) —
-- Phase 1 grants INSERT broadly to authenticated so triggers can log, but
-- no UPDATE/DELETE policy exists for anyone, which is the important part.
-- =========================================================================
create policy audit_logs_select on public.audit_logs
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or school_id = public.user_school_id()
  );

create policy audit_logs_insert on public.audit_logs
  for insert
  with check (
    school_id is null
    or school_id = public.user_school_id()
    or public.user_has_role('SUPER_ADMIN')
  );

-- No update/delete policies are created for audit_logs on purpose:
-- with RLS enabled and no matching policy, those operations are denied
-- to every role except the table owner (used only by migrations).
