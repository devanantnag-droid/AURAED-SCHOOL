-- AURAED SCHOOL — Phase 13: Transport
-- Run after 0001-0024.
--
-- Driver details are kept on the vehicle row rather than a separate
-- drivers table — a reasonable simplification for most schools where one
-- driver is consistently assigned to one vehicle; can be split into its
-- own table later without losing data if a school needs multi-driver
-- rotation per vehicle.

-- =========================================================================
-- VEHICLES
-- =========================================================================
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  vehicle_number text not null,
  vehicle_type text,
  capacity integer not null default 0 check (capacity >= 0),
  driver_name text,
  driver_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, vehicle_number)
);

create index if not exists idx_vehicles_school_id on public.vehicles(school_id);

-- =========================================================================
-- ROUTES & STOPS
-- =========================================================================
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_routes_school_id on public.routes(school_id);

create table if not exists public.stops (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  name text not null,
  stop_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_stops_route_id on public.stops(route_id);

-- =========================================================================
-- STUDENT TRANSPORT ASSIGNMENTS — one active assignment per student.
-- =========================================================================
create table if not exists public.student_transport (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  stop_id uuid not null references public.stops(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id)
);

create index if not exists idx_student_transport_school_id on public.student_transport(school_id);
create index if not exists idx_student_transport_route on public.student_transport(route_id);

-- =========================================================================
-- updated_at + audit triggers
-- =========================================================================
drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_routes_updated_at on public.routes;
create trigger trg_routes_updated_at before update on public.routes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_student_transport_updated_at on public.student_transport;
create trigger trg_student_transport_updated_at before update on public.student_transport
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_vehicles on public.vehicles;
create trigger trg_audit_vehicles
  after insert or update or delete on public.vehicles
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_routes on public.routes;
create trigger trg_audit_routes
  after insert or update or delete on public.routes
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_student_transport on public.student_transport;
create trigger trg_audit_student_transport
  after insert or update or delete on public.student_transport
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions — TRANSPORT_MANAGER (seeded since Phase 1, unused until
-- now) becomes the natural owner of this module alongside School Admin.
-- =========================================================================
insert into public.permissions (code, description) values
  ('transport.view', 'View vehicles, routes, stops, and assignments'),
  ('transport.manage', 'Manage vehicles, routes, stops, and student assignments')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('transport.view', 'transport.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'TRANSPORT_MANAGER' and p.code in ('transport.view', 'transport.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('PARENT', 'STUDENT') and p.code = 'transport.view'
on conflict do nothing;
