-- AURAED SCHOOL — Phase 1: foundation schema
-- Run in order: 0001_initial_schema.sql, then 0002_rls_policies.sql

create extension if not exists "pgcrypto";

-- =========================================================================
-- SCHOOLS
-- =========================================================================
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  registration_number text,
  email text not null,
  phone text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  logo_url text,
  principal_name text,
  website text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  working_days smallint[] not null default '{1,2,3,4,5}', -- 0=Sun..6=Sat
  geofence_enabled boolean not null default false,
  geofence_latitude double precision,
  geofence_longitude double precision,
  geofence_radius_meters integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- PROFILES (1:1 with auth.users)
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_school_id on public.profiles(school_id);

-- =========================================================================
-- RBAC
-- =========================================================================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  -- NULL school_id is only valid for platform-level roles (SUPER_ADMIN).
  -- Enforced by trigger below, not just convention.
  school_id uuid references public.schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role_id, school_id)
);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_school_id on public.user_roles(school_id);

-- A non-SUPER_ADMIN role assignment must carry a school_id; SUPER_ADMIN must not.
create or replace function public.enforce_user_role_school_scope()
returns trigger
language plpgsql
as $$
declare
  v_role_name text;
begin
  select name into v_role_name from public.roles where id = new.role_id;

  if v_role_name = 'SUPER_ADMIN' and new.school_id is not null then
    raise exception 'SUPER_ADMIN role assignments must not carry a school_id';
  end if;

  if v_role_name <> 'SUPER_ADMIN' and new.school_id is null then
    raise exception 'Non-SUPER_ADMIN role assignments must specify a school_id';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_user_role_school_scope on public.user_roles;
create trigger trg_enforce_user_role_school_scope
  before insert or update on public.user_roles
  for each row execute function public.enforce_user_role_school_scope();

-- =========================================================================
-- AUDIT LOGS (every later phase writes to this)
-- =========================================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_school_id on public.audit_logs(school_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

-- =========================================================================
-- updated_at maintenance
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_schools_updated_at on public.schools;
create trigger trg_schools_updated_at before update on public.schools
  for each row execute function public.set_updated_at();

drop trigger if exists trg_school_settings_updated_at on public.school_settings;
create trigger trg_school_settings_updated_at before update on public.school_settings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Auto-create a profile row when a new auth.users row appears
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- Seed: roles, a starter permission catalog, and sane default role_permissions
-- =========================================================================
insert into public.roles (name, description) values
  ('SUPER_ADMIN', 'Platform-wide administrator'),
  ('SCHOOL_ADMIN', 'Administrator for a single school'),
  ('TEACHER', 'Teaching staff'),
  ('PARENT', 'Parent/guardian of one or more students'),
  ('STUDENT', 'Enrolled student'),
  ('ACCOUNTANT', 'School finance staff'),
  ('LIBRARIAN', 'Library staff'),
  ('RECEPTIONIST', 'Front-desk staff'),
  ('TRANSPORT_MANAGER', 'Transport/fleet staff'),
  ('HR_MANAGER', 'Staff/HR management')
on conflict (name) do nothing;

insert into public.permissions (code, description) values
  ('platform.manage', 'Manage the platform (Super Admin only)'),
  ('students.view', 'View students'),
  ('students.create', 'Create students'),
  ('students.edit', 'Edit students'),
  ('students.delete', 'Delete/archive students'),
  ('attendance.view', 'View attendance'),
  ('attendance.create', 'Mark attendance'),
  ('attendance.edit', 'Edit attendance'),
  ('fees.view', 'View fees'),
  ('fees.create', 'Create fee records'),
  ('fees.edit', 'Edit fee records'),
  ('fees.delete', 'Delete fee records'),
  ('reports.view', 'View reports'),
  ('reports.export', 'Export reports'),
  ('announcements.create', 'Create announcements'),
  ('announcements.publish', 'Publish announcements')
on conflict (code) do nothing;

-- SUPER_ADMIN gets platform.manage; SCHOOL_ADMIN gets everything school-scoped.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SUPER_ADMIN' and p.code = 'platform.manage'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code <> 'platform.manage'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'TEACHER' and p.code in (
  'students.view', 'attendance.view', 'attendance.create', 'attendance.edit',
  'reports.view', 'reports.export'
)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'PARENT' and p.code in ('attendance.view', 'fees.view', 'reports.view')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'STUDENT' and p.code in ('attendance.view', 'reports.view')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'ACCOUNTANT' and p.code in (
  'fees.view', 'fees.create', 'fees.edit', 'fees.delete', 'reports.view', 'reports.export'
)
on conflict do nothing;
