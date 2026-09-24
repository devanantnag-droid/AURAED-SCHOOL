-- AURAED SCHOOL — Phase 32: Leave routing fix
-- Run after 0001-0052.
--
-- Leave approval routing:
--   - A TEACHER's leave request → approved/rejected by School Admin (as before).
--   - A STUDENT's leave request → approved/rejected by the class's
--     in-charge teacher (class_teachers), not School Admin.

drop policy if exists leave_requests_update_admin on public.leave_requests;

create policy leave_requests_update_school_admin on public.leave_requests
  for update using (
    school_id = public.user_school_id()
    and public.user_has_role('SCHOOL_ADMIN')
    and requester_type = 'teacher'
  ) with check (
    school_id = public.user_school_id()
    and public.user_has_role('SCHOOL_ADMIN')
    and requester_type = 'teacher'
  );

create policy leave_requests_update_class_teacher on public.leave_requests
  for update using (
    requester_type = 'student'
    and exists (
      select 1 from public.students s
      join public.class_teachers ct on ct.class_id = s.class_id
      where s.id = leave_requests.student_id and ct.teacher_id = public.current_teacher_id()
    )
  ) with check (
    requester_type = 'student'
    and exists (
      select 1 from public.students s
      join public.class_teachers ct on ct.class_id = s.class_id
      where s.id = leave_requests.student_id and ct.teacher_id = public.current_teacher_id()
    )
  );

-- Let the class in-charge teacher actually see the student leave requests
-- they now need to act on, even without the school-wide leave.view
-- permission (they're acting on their own class, not administering the
-- whole school's leave queue).
create policy leave_requests_select_class_teacher on public.leave_requests
  for select using (
    requester_type = 'student'
    and exists (
      select 1 from public.students s
      join public.class_teachers ct on ct.class_id = s.class_id
      where s.id = leave_requests.student_id and ct.teacher_id = public.current_teacher_id()
    )
  );

-- Notify the class in-charge teacher the moment one of their students
-- raises a leave request, so they actually know to review it.
create or replace function public.trg_notify_class_teacher_of_student_leave()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_user_id uuid;
begin
  if new.requester_type = 'student' then
    select t.user_id into v_teacher_user_id
    from public.students s
    join public.class_teachers ct on ct.class_id = s.class_id
    join public.teachers t on t.id = ct.teacher_id
    where s.id = new.student_id
    limit 1;

    if v_teacher_user_id is not null then
      insert into public.notifications (school_id, user_id, type, title, body, link)
      values (new.school_id, v_teacher_user_id, 'leave_request', 'A student in your class requested leave', new.reason, '/teacher/dashboard');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_student_leave_notify_teacher on public.leave_requests;
create trigger trg_student_leave_notify_teacher
  after insert on public.leave_requests
  for each row execute function public.trg_notify_class_teacher_of_student_leave();

-- Super Admin deleting their own (or any) platform announcement already
-- works: Phase 29's platform_announcements_write policy is `for all`
-- using user_has_role('SUPER_ADMIN'), which includes delete. Nothing to
-- change here — confirmed by the frontend work in this same phase.
