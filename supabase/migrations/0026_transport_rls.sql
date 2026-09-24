-- AURAED SCHOOL — Phase 13: RLS for vehicles/routes/stops/student_transport
-- Run after 0025_transport.sql.

alter table public.vehicles enable row level security;
alter table public.routes enable row level security;
alter table public.stops enable row level security;
alter table public.student_transport enable row level security;

create policy vehicles_select on public.vehicles
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('transport.view')));
create policy vehicles_write on public.vehicles
  for all using (school_id = public.user_school_id() and public.user_has_permission('transport.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('transport.manage'));
create policy vehicles_super_admin on public.vehicles
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy routes_select on public.routes
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('transport.view')));
create policy routes_write on public.routes
  for all using (school_id = public.user_school_id() and public.user_has_permission('transport.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('transport.manage'));
create policy routes_super_admin on public.routes
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy stops_select on public.stops
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('transport.view')));
create policy stops_write on public.stops
  for all using (school_id = public.user_school_id() and public.user_has_permission('transport.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('transport.manage'));
create policy stops_super_admin on public.stops
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy student_transport_select on public.student_transport
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('transport.view')));
create policy student_transport_write on public.student_transport
  for all using (school_id = public.user_school_id() and public.user_has_permission('transport.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('transport.manage'));
create policy student_transport_super_admin on public.student_transport
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
