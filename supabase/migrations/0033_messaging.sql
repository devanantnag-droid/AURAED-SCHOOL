-- AURAED SCHOOL — Phase 17: Messaging & Announcements
-- Run after 0001-0032.

-- =========================================================================
-- ANNOUNCEMENTS
-- =========================================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  body text not null,
  target_type text not null default 'all' check (target_type in ('all', 'role', 'class')),
  target_role text,
  target_class_id uuid references public.classes(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (target_type = 'all' and target_role is null and target_class_id is null)
    or (target_type = 'role' and target_role is not null and target_class_id is null)
    or (target_type = 'class' and target_class_id is not null and target_role is null)
  )
);

create index if not exists idx_announcements_school_id on public.announcements(school_id);

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_announcements on public.announcements;
create trigger trg_audit_announcements
  after insert or update or delete on public.announcements
  for each row execute function public.audit_row_change();

-- =========================================================================
-- MESSAGES — simple direct messaging between any two logged-in users at
-- the same school (parents/students don't have portal logins yet, so in
-- practice this is staff-to-staff for now — same limitation noted in
-- earlier phases).
-- =========================================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists idx_messages_school_id on public.messages(school_id);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_recipient on public.messages(recipient_id);

-- =========================================================================
-- New permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('announcements.view', 'View announcements'),
  ('announcements.manage', 'Create and manage announcements'),
  ('messaging.use', 'Send and receive internal messages')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in (
  'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'ACCOUNTANT',
  'LIBRARIAN', 'RECEPTIONIST', 'TRANSPORT_MANAGER', 'HR_MANAGER'
) and p.code in ('announcements.view', 'messaging.use')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code = 'announcements.manage'
on conflict do nothing;
