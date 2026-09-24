-- AURAED SCHOOL — Phase 41: Student can see their own bus location
-- Run after 0001-0061.
--
-- The original vehicle_locations_select policy (0057) only granted
-- visibility to a PARENT viewing their child's bus (via is_parent_of).
-- It never included the equivalent case of a STUDENT logging in
-- directly and viewing their own bus — that branch was simply missing.
-- A student in this app can already see their own route/vehicle number
-- (via the broader transport.view permission on student_transport), so
-- this closes the gap for the specific vehicle_locations table too.
-- Also switches the driver-owns-vehicle check to the is_my_vehicle()
-- helper added in 0060, for the same reliability reason as before.

drop policy if exists vehicle_locations_select on public.vehicle_locations;
create policy vehicle_locations_select on public.vehicle_locations
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('vehicle_location.view') and (
      public.user_has_role('SCHOOL_ADMIN')
      or public.user_has_role('TRANSPORT_MANAGER')
      or public.is_my_vehicle(vehicle_id)
      or exists (
        select 1 from public.student_transport st
        join public.routes r on r.id = st.route_id
        join public.students s on s.id = st.student_id
        where r.vehicle_id = vehicle_locations.vehicle_id
          and (public.is_parent_of(s.id) or s.id = public.current_student_id())
      )
    ))
  );
