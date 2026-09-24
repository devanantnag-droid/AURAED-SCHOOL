-- AURAED SCHOOL — Phase 36: Live Bus Tracking (foundation)
-- Run after 0001-0056.
--
-- Until now, a vehicle's "driver" was just two free-text fields
-- (driver_name, driver_phone) with no real login — there was nothing to
-- report a live position from. This adds a genuine DRIVER role, links a
-- vehicle to that driver's actual account, and a location table the
-- driver's phone updates. Deliberately kept to ONE row per vehicle
-- (latest position only, upserted) rather than a full location history
-- log — a growing history table isn't needed for "where is the bus
-- right now", and avoids unbounded row growth from frequent updates.

insert into public.roles (name, description) values
  ('DRIVER', 'Vehicle driver who shares live location during a route')
on conflict (name) do nothing;

alter table public.vehicles add column if not exists driver_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.vehicle_locations (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicle_locations_school on public.vehicle_locations(school_id);

-- =========================================================================
-- Permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('vehicle_location.share', 'Share live location as a vehicle''s driver'),
  ('vehicle_location.view', 'View a vehicle''s live location')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'DRIVER' and p.code = 'vehicle_location.share'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'PARENT') and p.code = 'vehicle_location.view'
on conflict do nothing;

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.vehicle_locations enable row level security;

-- School Admin/Transport Manager see every vehicle at their school. A
-- driver sees their own assigned vehicle. A parent sees a vehicle only
-- if one of their children rides a route that vehicle actually serves
-- (student_transport → routes.vehicle_id, not a direct link).
create policy vehicle_locations_select on public.vehicle_locations
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('vehicle_location.view') and (
      public.user_has_role('SCHOOL_ADMIN')
      or public.user_has_role('TRANSPORT_MANAGER')
      or exists (
        select 1 from public.vehicles v where v.id = vehicle_locations.vehicle_id and v.driver_user_id = auth.uid()
      )
      or exists (
        select 1 from public.student_transport st
        join public.routes r on r.id = st.route_id
        join public.students s on s.id = st.student_id
        where r.vehicle_id = vehicle_locations.vehicle_id and public.is_parent_of(s.id)
      )
    ))
  );

-- Only the vehicle's own assigned driver can write its location — this
-- is the whole security boundary for the feature: nobody can spoof
-- another vehicle's position.
create policy vehicle_locations_upsert on public.vehicle_locations
  for insert with check (
    public.user_has_permission('vehicle_location.share')
    and exists (select 1 from public.vehicles v where v.id = vehicle_locations.vehicle_id and v.driver_user_id = auth.uid())
  );

create policy vehicle_locations_update on public.vehicle_locations
  for update using (
    exists (select 1 from public.vehicles v where v.id = vehicle_locations.vehicle_id and v.driver_user_id = auth.uid())
  );
