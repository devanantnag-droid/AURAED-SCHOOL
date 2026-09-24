-- AURAED SCHOOL — Phase 2: school self-edit permissions + reusable audit trigger
-- Run after 0001 and 0002.

-- =========================================================================
-- Allow a SCHOOL_ADMIN to update their own school's editable profile fields
-- (name, contact info, description, etc.) without needing Super Admin.
-- `code` and `is_active` remain Super Admin-only — enforced by a trigger
-- below, not just by convention, since a client-side form could otherwise
-- submit those fields too.
-- =========================================================================
create policy schools_update_own_admin on public.schools
  for update
  using (id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN'))
  with check (id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN'));

create or replace function public.prevent_school_admin_protected_field_changes()
returns trigger
language plpgsql
as $$
begin
  if public.user_has_role('SUPER_ADMIN') then
    return new; -- Super Admin may change anything, including code/is_active.
  end if;

  if new.code is distinct from old.code then
    raise exception 'Only a Super Admin can change a school''s code';
  end if;

  if new.is_active is distinct from old.is_active then
    raise exception 'Only a Super Admin can activate/deactivate a school';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_school_admin_protected_fields on public.schools;
create trigger trg_prevent_school_admin_protected_fields
  before update on public.schools
  for each row execute function public.prevent_school_admin_protected_field_changes();

-- =========================================================================
-- Generic, reusable audit-log trigger — every future table that needs
-- create/update/delete tracked (students, fees, marks, ...) can attach this
-- same function instead of writing a bespoke trigger per table. This is the
-- pattern the master spec's audit-logging section is built on.
-- Works for any table that has an `id` column; captures `school_id` from
-- the row when present, falls back to null otherwise (reports can still
-- join through entity_id for tables without a direct school_id column).
-- =========================================================================
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
  v_entity_id uuid;
begin
  begin
    if tg_op = 'DELETE' then
      v_school_id := (to_jsonb(old) ->> 'school_id')::uuid;
      v_entity_id := (to_jsonb(old) ->> 'id')::uuid;
    else
      v_school_id := (to_jsonb(new) ->> 'school_id')::uuid;
      v_entity_id := (to_jsonb(new) ->> 'id')::uuid;
    end if;
  exception when others then
    v_school_id := null;
  end;

  -- schools table doesn't have its own school_id column — its own id IS
  -- the school it describes, so fall back to that for this one table.
  if v_school_id is null and tg_table_name = 'schools' then
    v_school_id := v_entity_id;
  end if;

  insert into public.audit_logs (school_id, user_id, action, entity_type, entity_id, old_data, new_data)
  values (
    v_school_id,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    v_entity_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_schools on public.schools;
create trigger trg_audit_schools
  after insert or update or delete on public.schools
  for each row execute function public.audit_row_change();
