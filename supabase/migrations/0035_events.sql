-- AURAED SCHOOL — Phase 18: Events & Calendar
-- Run after 0001-0034.

-- =========================================================================
-- EVENTS — reuses the same all/role/class targeting shape as Phase 17's
-- announcements, for a consistent mental model.
-- =========================================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  start_time time,
  end_time time,
  location text,
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

create index if not exists idx_events_school_id on public.events(school_id, event_date);

-- =========================================================================
-- EVENT RSVPS
-- =========================================================================
create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response text not null check (response in ('going', 'not_going', 'maybe')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists idx_event_rsvps_event on public.event_rsvps(event_id);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists trg_event_rsvps_updated_at on public.event_rsvps;
create trigger trg_event_rsvps_updated_at before update on public.event_rsvps
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_events on public.events;
create trigger trg_audit_events
  after insert or update or delete on public.events
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('events.view', 'View school events and calendar'),
  ('events.manage', 'Create and manage school events')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in (
  'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'ACCOUNTANT',
  'LIBRARIAN', 'RECEPTIONIST', 'TRANSPORT_MANAGER', 'HR_MANAGER'
) and p.code = 'events.view'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code = 'events.manage'
on conflict do nothing;
