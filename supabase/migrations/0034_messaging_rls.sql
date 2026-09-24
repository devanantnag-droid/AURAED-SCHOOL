-- AURAED SCHOOL — Phase 17: RLS for announcements/messages
-- Run after 0033_messaging.sql.

alter table public.announcements enable row level security;
alter table public.messages enable row level security;

-- =========================================================================
-- Widen profile visibility for messaging — the existing profiles_select
-- policy (from Phase 1) only lets a user see their own profile or, if
-- they're School Admin, everyone at their school. That leaves a regular
-- Teacher unable to see any colleague to message. This adds (doesn't
-- replace) visibility: anyone with messaging.use can see other profiles
-- at the same school, so a recipient picker actually has names to show.
-- =========================================================================
create policy profiles_select_for_messaging on public.profiles
  for select using (school_id = public.user_school_id() and public.user_has_permission('messaging.use'));

-- =========================================================================
-- ANNOUNCEMENTS — visible to the poster/admin, and to whoever matches the
-- actual target: everyone (target_type='all'), a matching role
-- (target_type='role'), or — for target_type='class' — only a teacher
-- genuinely assigned to that class (via class_teachers/subject_teachers),
-- the same precision pattern as Phase 7/8's teacher_teaches() checks.
-- =========================================================================
create policy announcements_select on public.announcements
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (
      school_id = public.user_school_id()
      and public.user_has_permission('announcements.view')
      and (
        target_type = 'all'
        or (
          target_type = 'role'
          and exists (
            select 1 from public.user_roles ur
            join public.roles r on r.id = ur.role_id
            where ur.user_id = auth.uid() and r.name = announcements.target_role
          )
        )
        or (
          target_type = 'class'
          and (
            public.user_has_role('SCHOOL_ADMIN')
            or exists (select 1 from public.class_teachers ct where ct.class_id = announcements.target_class_id and ct.teacher_id = public.current_teacher_id())
            or exists (select 1 from public.subject_teachers st where st.class_id = announcements.target_class_id and st.teacher_id = public.current_teacher_id())
          )
        )
      )
    )
  );

create policy announcements_write on public.announcements
  for all using (school_id = public.user_school_id() and public.user_has_permission('announcements.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('announcements.manage'));

create policy announcements_super_admin on public.announcements
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- MESSAGES — only the sender and recipient can ever see a message.
-- =========================================================================
create policy messages_select on public.messages
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or sender_id = auth.uid()
    or recipient_id = auth.uid()
  );

create policy messages_insert on public.messages
  for insert with check (
    school_id = public.user_school_id()
    and sender_id = auth.uid()
    and public.user_has_permission('messaging.use')
  );

create policy messages_update on public.messages
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy messages_super_admin on public.messages
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
