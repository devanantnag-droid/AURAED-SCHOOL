-- AURAED SCHOOL — Phase 24: Grievance System
-- Run after 0047_announcements_events_student_view.sql.
--
-- A parent or student can raise a grievance against a teacher or about
-- any other issue. Deliberately private by design: the named teacher is
-- NEVER given automatic visibility into a grievance against them — only
-- School Admin and the person who raised it can see it. If School Admin
-- needs to involve the teacher, that happens outside this system (a
-- conversation, not an automatic notification), matching how real
-- schools handle sensitive complaints.

create table if not exists public.grievances (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  raised_by uuid references auth.users(id) on delete set null,
  against_teacher_id uuid references public.teachers(id) on delete set null,
  subject text not null,
  description text not null,
  category text not null default 'other' check (category in ('teacher_conduct', 'bullying', 'facility', 'academic', 'other')),
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_grievances_school_id on public.grievances(school_id);
create index if not exists idx_grievances_student on public.grievances(student_id);

create table if not exists public.grievance_replies (
  id uuid primary key default gen_random_uuid(),
  grievance_id uuid not null references public.grievances(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_grievance_replies_grievance on public.grievance_replies(grievance_id);

drop trigger if exists trg_grievances_updated_at on public.grievances;
create trigger trg_grievances_updated_at before update on public.grievances
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_grievances on public.grievances;
create trigger trg_audit_grievances
  after insert or update or delete on public.grievances
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('grievances.view', 'View grievances raised at the school'),
  ('grievances.manage', 'Raise a grievance and reply to it, or (for School Admin) triage it')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('grievances.view', 'grievances.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('PARENT', 'STUDENT') and p.code = 'grievances.manage'
on conflict do nothing;

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.grievances enable row level security;
alter table public.grievance_replies enable row level security;

-- SELECT: School Admin sees every grievance at their school; the person
-- who raised it sees their own. The named teacher (against_teacher_id)
-- gets NO special access here, by design.
create policy grievances_select on public.grievances
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('grievances.view'))
    or raised_by = auth.uid()
  );

-- INSERT: the raiser must be a parent/student genuinely linked to the
-- named student — a parent can only raise on behalf of their own child,
-- a student only for themselves.
create policy grievances_insert on public.grievances
  for insert with check (
    school_id = public.user_school_id()
    and public.user_has_permission('grievances.manage')
    and raised_by = auth.uid()
    and (student_id = public.current_student_id() or public.is_parent_of(student_id))
  );

-- UPDATE: status changes are School Admin's job only, same asymmetry as
-- Phase 23's tickets.
create policy grievances_update_admin on public.grievances
  for update using (
    school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN')
  ) with check (
    school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN')
  );

create policy grievances_super_admin on public.grievances
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- REPLIES: visible only to whoever can see the parent grievance (School
-- Admin or the original raiser) — never the named teacher.
create policy grievance_replies_select on public.grievance_replies
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or exists (
      select 1 from public.grievances g
      where g.id = grievance_replies.grievance_id
        and (
          (g.school_id = public.user_school_id() and public.user_has_permission('grievances.view'))
          or g.raised_by = auth.uid()
        )
    )
  );

create policy grievance_replies_insert on public.grievance_replies
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.grievances g
      where g.id = grievance_replies.grievance_id
        and (
          (g.school_id = public.user_school_id() and public.user_has_role('SCHOOL_ADMIN'))
          or g.raised_by = auth.uid()
        )
    )
  );
