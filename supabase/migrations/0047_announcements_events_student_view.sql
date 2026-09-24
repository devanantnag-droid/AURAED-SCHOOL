-- AURAED SCHOOL — Phase 24: class-targeted announcements/events now reach students/parents
-- Run after 0046_portal_foundation.sql.
--
-- Phase 17/18's class-target check only covered a teacher genuinely
-- assigned to that class. Role-targeting already reaches PARENT/STUDENT
-- correctly (they were granted announcements.view/events.view back in
-- Phase 17/18), but class-targeting never did. This adds that.

drop policy if exists announcements_select on public.announcements;

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
            or exists (select 1 from public.students s where s.id = public.current_student_id() and s.class_id = announcements.target_class_id)
            or exists (
              select 1 from public.students s
              where public.is_parent_of(s.id) and s.class_id = announcements.target_class_id
            )
          )
        )
      )
    )
  );

drop policy if exists events_select on public.events;

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
            or exists (select 1 from public.students s where s.id = public.current_student_id() and s.class_id = events.target_class_id)
            or exists (
              select 1 from public.students s
              where public.is_parent_of(s.id) and s.class_id = events.target_class_id
            )
          )
        )
      )
    )
  );
