-- AURAED SCHOOL — Phase 27: Leave System
-- Run after 0001-0049.

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  requester_type text not null check (requester_type in ('teacher', 'student')),
  teacher_id uuid references public.teachers(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  leave_type text not null default 'other' check (leave_type in ('sick', 'casual', 'emergency', 'other')),
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (requester_type = 'teacher' and teacher_id is not null and student_id is null)
    or (requester_type = 'student' and student_id is not null and teacher_id is null)
  ),
  check (end_date >= start_date)
);

create index if not exists idx_leave_requests_school on public.leave_requests(school_id, status);

drop trigger if exists trg_leave_requests_updated_at on public.leave_requests;
create trigger trg_leave_requests_updated_at before update on public.leave_requests
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_leave_requests on public.leave_requests;
create trigger trg_audit_leave_requests
  after insert or update or delete on public.leave_requests
  for each row execute function public.audit_row_change();

-- =========================================================================
-- Feature gate — a school only sees Leave System if their plan includes it,
-- same pattern as every other module.
-- =========================================================================
insert into public.features (code, name, description) values
  ('leave_management', 'Leave System', 'Leave requests for teachers and students, with approval workflow')
on conflict (code) do nothing;

-- =========================================================================
-- Permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('leave.view', 'View leave requests at the school'),
  ('leave.manage', 'Raise a leave request, or (for School Admin) approve/reject it')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('leave.view', 'leave.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('TEACHER', 'STUDENT') and p.code = 'leave.manage'
on conflict do nothing;

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.leave_requests enable row level security;

create policy leave_requests_select on public.leave_requests
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('leave.view'))
    or requested_by = auth.uid()
  );

create policy leave_requests_insert on public.leave_requests
  for insert with check (
    school_id = public.user_school_id()
    and public.user_has_permission('leave.manage')
    and requested_by = auth.uid()
    and (
      (requester_type = 'teacher' and teacher_id = public.current_teacher_id())
      or (requester_type = 'student' and student_id = public.current_student_id())
    )
  );

-- Status changes (approve/reject) are School Admin's job only, same
-- asymmetry as tickets/grievances.
create policy leave_requests_update_admin on public.leave_requests
  for update using (
    school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN')
  ) with check (
    school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN')
  );

create policy leave_requests_super_admin on public.leave_requests
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- Notify the requester the moment their leave is approved/rejected,
-- reusing Phase 25's notification system.
-- =========================================================================
create or replace function public.trg_notify_leave_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') and new.requested_by is not null then
    insert into public.notifications (school_id, user_id, type, title, body, link)
    values (
      new.school_id,
      new.requested_by,
      'leave_decision',
      'Your leave request was ' || new.status,
      new.review_notes,
      case when new.requester_type = 'teacher' then '/teacher/dashboard' else '/student/dashboard' end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leave_decision_notify on public.leave_requests;
create trigger trg_leave_decision_notify
  after update on public.leave_requests
  for each row execute function public.trg_notify_leave_decision();
