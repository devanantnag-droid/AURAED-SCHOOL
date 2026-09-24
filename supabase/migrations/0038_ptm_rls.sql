-- AURAED SCHOOL — Phase 19: RLS for ptm_sessions/ptm_slots/ptm_bookings
-- Run after 0037_ptm.sql.

alter table public.ptm_sessions enable row level security;
alter table public.ptm_slots enable row level security;
alter table public.ptm_bookings enable row level security;

create policy ptm_sessions_select on public.ptm_sessions
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('ptm.view')));
create policy ptm_sessions_write on public.ptm_sessions
  for all using (school_id = public.user_school_id() and public.user_has_permission('ptm.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('ptm.manage'));
create policy ptm_sessions_super_admin on public.ptm_sessions
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy ptm_slots_select on public.ptm_slots
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('ptm.view')));
create policy ptm_slots_write on public.ptm_slots
  for all using (school_id = public.user_school_id() and public.user_has_permission('ptm.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('ptm.manage'));
create policy ptm_slots_super_admin on public.ptm_slots
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy ptm_bookings_select on public.ptm_bookings
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('ptm.view')));
create policy ptm_bookings_write on public.ptm_bookings
  for all using (school_id = public.user_school_id() and public.user_has_permission('ptm.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('ptm.manage'));
create policy ptm_bookings_super_admin on public.ptm_bookings
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
