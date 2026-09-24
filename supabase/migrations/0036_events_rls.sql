-- AURAED SCHOOL — Phase 18: RLS for events/event_rsvps
-- Run after 0035_events.sql.

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

-- =========================================================================
-- EVENTS — same targeted-visibility logic as Phase 17's announcements:
-- everyone, a matching role, or — for a class — only a teacher genuinely
-- assigned there.
-- =========================================================================
create policy events_select on public.events
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (
      school_id = public.user_school_id()
      and public.user_has_permission('events.view')
      and (
        target_type = 'all'
        or (
          target_type = 'role'
          and exists (
            select 1 from public.user_roles ur
            join public.roles r on r.id = ur.role_id
            where ur.user_id = auth.uid() and r.name = events.target_role
          )
        )
        or (
          target_type = 'class'
          and (
            public.user_has_role('SCHOOL_ADMIN')
            or exists (select 1 from public.class_teachers ct where ct.class_id = events.target_class_id and ct.teacher_id = public.current_teacher_id())
            or exists (select 1 from public.subject_teachers st where st.class_id = events.target_class_id and st.teacher_id = public.current_teacher_id())
          )
        )
      )
    )
  );

create policy events_write on public.events
  for all using (school_id = public.user_school_id() and public.user_has_permission('events.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('events.manage'));

create policy events_super_admin on public.events
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- EVENT RSVPS — a user can see and manage their own RSVP; the event's
-- creator/School Admin can see everyone's RSVP for headcount purposes.
-- =========================================================================
create policy event_rsvps_select on public.event_rsvps
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or user_id = auth.uid()
    or (school_id = public.user_school_id() and public.user_has_permission('events.manage'))
  );

create policy event_rsvps_insert on public.event_rsvps
  for insert with check (school_id = public.user_school_id() and user_id = auth.uid() and public.user_has_permission('events.view'));

create policy event_rsvps_update on public.event_rsvps
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy event_rsvps_delete on public.event_rsvps
  for delete using (user_id = auth.uid());

create policy event_rsvps_super_admin on public.event_rsvps
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
