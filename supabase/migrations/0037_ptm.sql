-- AURAED SCHOOL — Phase 19: PTM Scheduling
-- Run after 0001-0036.
--
-- There's no parent portal login yet (same limitation noted in earlier
-- phases), so booking a slot is done by front-desk/admin staff on a
-- parent's behalf — a walk-in or phone booking, not parent self-service.

-- =========================================================================
-- PTM SESSIONS — an overall PTM day/event that teachers offer slots
-- within (e.g. "Term 1 Parent-Teacher Meeting").
-- =========================================================================
create table if not exists public.ptm_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid references public.academic_sessions(id) on delete set null,
  title text not null,
  ptm_date date not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ptm_sessions_school_id on public.ptm_sessions(school_id);

-- =========================================================================
-- PTM SLOTS — a single bookable time slot for one teacher within a
-- session. is_booked is maintained automatically by the trigger below.
-- =========================================================================
create table if not exists public.ptm_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  ptm_session_id uuid not null references public.ptm_sessions(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  start_time time not null,
  end_time time not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_ptm_slots_session on public.ptm_slots(ptm_session_id);
create index if not exists idx_ptm_slots_teacher on public.ptm_slots(teacher_id);

-- =========================================================================
-- PTM BOOKINGS — one booking per slot (enforced by the unique constraint
-- on ptm_slot_id), recording which student's parent is meeting and their
-- contact details, since they may not have a portal login to attach to.
-- =========================================================================
create table if not exists public.ptm_bookings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  ptm_slot_id uuid not null references public.ptm_slots(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  parent_name text not null,
  parent_phone text,
  notes text,
  booked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (ptm_slot_id)
);

create index if not exists idx_ptm_bookings_school_id on public.ptm_bookings(school_id);
create index if not exists idx_ptm_bookings_student on public.ptm_bookings(student_id);

-- Keep ptm_slots.is_booked in sync automatically — never set directly.
create or replace function public.sync_ptm_slot_booked()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.ptm_slots set is_booked = true where id = new.ptm_slot_id;
  elsif tg_op = 'DELETE' then
    update public.ptm_slots set is_booked = false where id = old.ptm_slot_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_ptm_slot_booked on public.ptm_bookings;
create trigger trg_sync_ptm_slot_booked
  after insert or delete on public.ptm_bookings
  for each row execute function public.sync_ptm_slot_booked();

drop trigger if exists trg_ptm_sessions_updated_at on public.ptm_sessions;
create trigger trg_ptm_sessions_updated_at before update on public.ptm_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_ptm_bookings on public.ptm_bookings;
create trigger trg_audit_ptm_bookings
  after insert or update or delete on public.ptm_bookings
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('ptm.view', 'View PTM sessions, slots, and bookings'),
  ('ptm.manage', 'Create PTM sessions/slots and book on a parent''s behalf')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('ptm.view', 'ptm.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'RECEPTIONIST' and p.code in ('ptm.view', 'ptm.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'TEACHER' and p.code = 'ptm.view'
on conflict do nothing;
