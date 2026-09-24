-- AURAED SCHOOL — Phase 25a: In-app Notification Center
-- Run after 0001-0048.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_select_self on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update_self on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Inserts only ever happen from trigger functions below (security definer),
-- never directly from the client — no insert policy needed for
-- authenticated users, and none is granted.

-- =========================================================================
-- notify_targeted_users(school_id, target_type, target_role, target_class_id,
--                        type, title, body, link)
-- Shared helper: given the same all/role/class targeting used by
-- announcements and events, inserts one notification per matching user.
-- =========================================================================
create or replace function public.notify_targeted_users(
  p_school_id uuid,
  p_target_type text,
  p_target_role text,
  p_target_class_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_target_type = 'all' then
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select p_school_id, ur.user_id, p_type, p_title, p_body, p_link
    from public.user_roles ur
    where ur.school_id = p_school_id;

  elsif p_target_type = 'role' then
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select p_school_id, ur.user_id, p_type, p_title, p_body, p_link
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.school_id = p_school_id and r.name = p_target_role;

  elsif p_target_type = 'class' then
    -- Teachers assigned to the class (class teacher or subject teacher)
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select distinct p_school_id, t.user_id, p_type, p_title, p_body, p_link
    from public.teachers t
    where t.user_id is not null
      and (
        exists (select 1 from public.class_teachers ct where ct.class_id = p_target_class_id and ct.teacher_id = t.id)
        or exists (select 1 from public.subject_teachers st where st.class_id = p_target_class_id and st.teacher_id = t.id)
      );

    -- Students in that class
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select p_school_id, s.user_id, p_type, p_title, p_body, p_link
    from public.students s
    where s.class_id = p_target_class_id and s.user_id is not null;

    -- Parents of students in that class
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select distinct p_school_id, par.user_id, p_type, p_title, p_body, p_link
    from public.students s
    join public.parent_students ps on ps.student_id = s.id
    join public.parents par on par.id = ps.parent_id
    where s.class_id = p_target_class_id and par.user_id is not null;
  end if;
end;
$$;

-- =========================================================================
-- Announcements / Events → notifications
-- =========================================================================
create or replace function public.trg_notify_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_targeted_users(
    new.school_id, new.target_type, new.target_role, new.target_class_id,
    'announcement', new.title, left(new.body, 200), '/school/announcements'
  );
  return new;
end;
$$;

drop trigger if exists trg_announcement_notify on public.announcements;
create trigger trg_announcement_notify
  after insert on public.announcements
  for each row execute function public.trg_notify_announcement();

create or replace function public.trg_notify_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_targeted_users(
    new.school_id, new.target_type, new.target_role, new.target_class_id,
    'event', new.title, 'New event: ' || new.event_date::text, '/school/events'
  );
  return new;
end;
$$;

drop trigger if exists trg_event_notify on public.events;
create trigger trg_event_notify
  after insert on public.events
  for each row execute function public.trg_notify_event();

-- =========================================================================
-- Homework / Assignments → notify that class's students + parents
-- =========================================================================
create or replace function public.trg_notify_homework()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (school_id, user_id, type, title, body, link)
  select new.school_id, s.user_id, 'homework', 'New homework: ' || new.title, new.description, '/school/homework'
  from public.students s where s.class_id = new.class_id and s.section_id = new.section_id and s.user_id is not null;

  insert into public.notifications (school_id, user_id, type, title, body, link)
  select distinct new.school_id, par.user_id, 'homework', 'New homework: ' || new.title, new.description, '/school/homework'
  from public.students s
  join public.parent_students ps on ps.student_id = s.id
  join public.parents par on par.id = ps.parent_id
  where s.class_id = new.class_id and s.section_id = new.section_id and par.user_id is not null;

  return new;
end;
$$;

drop trigger if exists trg_homework_notify on public.homework;
create trigger trg_homework_notify
  after insert on public.homework
  for each row execute function public.trg_notify_homework();

create or replace function public.trg_notify_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (school_id, user_id, type, title, body, link)
  select new.school_id, s.user_id, 'assignment', 'New assignment: ' || new.title, new.description, '/school/assignments'
  from public.students s where s.class_id = new.class_id and s.section_id = new.section_id and s.user_id is not null;

  insert into public.notifications (school_id, user_id, type, title, body, link)
  select distinct new.school_id, par.user_id, 'assignment', 'New assignment: ' || new.title, new.description, '/school/assignments'
  from public.students s
  join public.parent_students ps on ps.student_id = s.id
  join public.parents par on par.id = ps.parent_id
  where s.class_id = new.class_id and s.section_id = new.section_id and par.user_id is not null;

  return new;
end;
$$;

drop trigger if exists trg_assignment_notify on public.assignments;
create trigger trg_assignment_notify
  after insert on public.assignments
  for each row execute function public.trg_notify_assignment();

-- =========================================================================
-- New tickets → notify every Super Admin (they aren't scoped to one
-- school, so this selects by role rather than by school_id).
-- =========================================================================
create or replace function public.trg_notify_new_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (school_id, user_id, type, title, body, link)
  select new.school_id, ur.user_id, 'new_ticket', 'New support ticket: ' || new.subject, left(new.description, 200), '/super-admin/tickets'
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where r.name = 'SUPER_ADMIN';
  return new;
end;
$$;

drop trigger if exists trg_new_ticket_notify on public.tickets;
create trigger trg_new_ticket_notify
  after insert on public.tickets
  for each row execute function public.trg_notify_new_ticket();

-- =========================================================================
-- Ticket replies → notify whichever side did NOT send the reply: the
-- School Admin who raised it if Super Admin replied, or every Super Admin
-- if the School Admin replied.
-- =========================================================================
create or replace function public.trg_notify_ticket_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
  v_created_by uuid;
begin
  select school_id, created_by into v_school_id, v_created_by from public.tickets where id = new.ticket_id;

  if v_created_by is not null and new.sender_id = v_created_by then
    -- The School Admin replied — notify every Super Admin.
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select v_school_id, ur.user_id, 'ticket_reply', 'New reply on a support ticket', left(new.body, 200), '/super-admin/tickets'
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where r.name = 'SUPER_ADMIN';
  elsif v_created_by is not null then
    -- Someone else (Super Admin) replied — notify the School Admin who raised it.
    insert into public.notifications (school_id, user_id, type, title, body, link)
    values (v_school_id, v_created_by, 'ticket_reply', 'New reply on your support ticket', left(new.body, 200), '/school/tickets');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ticket_reply_notify on public.ticket_replies;
create trigger trg_ticket_reply_notify
  after insert on public.ticket_replies
  for each row execute function public.trg_notify_ticket_reply();

-- =========================================================================
-- Grievance replies → notify the raiser (School Admin's replies never
-- reach the named teacher, consistent with this system's privacy design)
-- =========================================================================
create or replace function public.trg_notify_grievance_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
  v_raised_by uuid;
begin
  select school_id, raised_by into v_school_id, v_raised_by from public.grievances where id = new.grievance_id;

  if v_raised_by is not null and new.sender_id is distinct from v_raised_by then
    insert into public.notifications (school_id, user_id, type, title, body, link)
    values (v_school_id, v_raised_by, 'grievance_reply', 'New reply on your grievance', left(new.body, 200), '/school/grievances');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_grievance_reply_notify on public.grievance_replies;
create trigger trg_grievance_reply_notify
  after insert on public.grievance_replies
  for each row execute function public.trg_notify_grievance_reply();
