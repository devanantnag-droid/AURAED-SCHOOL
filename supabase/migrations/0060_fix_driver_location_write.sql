-- AURAED SCHOOL — Phase 39: Fix driver's location-write policy
-- Run after 0001-0059.
--
-- The original vehicle_locations_upsert/update policies (0057) checked
-- vehicle ownership with a raw "exists (select 1 from public.vehicles
-- v where ...)" subquery. That subquery is itself subject to vehicles'
-- own row-level security — it is NOT automatically privileged just
-- because it's nested inside another table's policy. Every other
-- ownership check in this app (is_parent_of, current_student_id,
-- user_has_permission) uses a dedicated security-definer function
-- specifically so it bypasses the referenced table's RLS and always
-- gives a reliable yes/no answer. This adds that same pattern for
-- vehicles, then rewrites the two location policies to use it.

create or replace function public.is_my_vehicle(target_vehicle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.vehicles v
    where v.id = target_vehicle_id and v.driver_user_id = auth.uid()
  );
$$;

grant execute on function public.is_my_vehicle(uuid) to authenticated;

drop policy if exists vehicle_locations_upsert on public.vehicle_locations;
create policy vehicle_locations_upsert on public.vehicle_locations
  for insert with check (
    public.user_has_permission('vehicle_location.share')
    and public.is_my_vehicle(vehicle_id)
  );

drop policy if exists vehicle_locations_update on public.vehicle_locations;
create policy vehicle_locations_update on public.vehicle_locations
  for update using (public.is_my_vehicle(vehicle_id));
