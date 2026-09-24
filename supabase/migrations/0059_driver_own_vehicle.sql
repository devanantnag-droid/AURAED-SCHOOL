-- AURAED SCHOOL — Phase 38: Driver can see their own vehicle
-- Run after 0001-0058.
--
-- The original vehicles_select policy (0026_transport_rls.sql) requires
-- transport.view, which DRIVER correctly does not have — a driver
-- shouldn't be able to browse every vehicle at the school. But they do
-- need to see the ONE vehicle they're actually assigned to (so the
-- driver dashboard can resolve it), which the existing policy has no
-- way to grant. This adds a second, narrower policy just for that case
-- — RLS policies are OR'd together, so this only ever adds visibility,
-- never removes any of the existing checks.

create policy vehicles_select_own_driver on public.vehicles
  for select using (driver_user_id = auth.uid());
