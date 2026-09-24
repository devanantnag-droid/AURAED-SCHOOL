-- AURAED SCHOOL — Phase 6: Teacher Punch In/Out, Geofencing, Corrections
-- Run after 0001-0009.

-- =========================================================================
-- Helper: resolve the calling user's own teacher record, scoped to their
-- own school. Returns null if the caller isn't a teacher (or has no linked
-- login yet) — used by RLS so a teacher can only ever punch themselves in,
-- never another teacher.
-- =========================================================================
create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.teachers
  where user_id = auth.uid() and school_id = public.user_school_id();
$$;

grant execute on function public.current_teacher_id() to authenticated;

-- =========================================================================
-- TEACHER PUNCH RECORDS
-- =========================================================================
create table if not exists public.teacher_punch_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  punch_date date not null default current_date,
  punch_in timestamptz,
  punch_out timestamptz,
  working_minutes integer,
  status text not null default 'open' check (status in ('open', 'complete')),
  latitude double precision,
  longitude double precision,
  device_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, punch_date)
);

create index if not exists idx_teacher_punch_school_id on public.teacher_punch_records(school_id);
create index if not exists idx_teacher_punch_teacher_id on public.teacher_punch_records(teacher_id);
create index if not exists idx_teacher_punch_date on public.teacher_punch_records(school_id, punch_date);

-- Compute working_minutes automatically whenever punch_out is set/changed.
create or replace function public.compute_punch_working_minutes()
returns trigger
language plpgsql
as $$
begin
  if new.punch_out is not null and new.punch_in is not null then
    new.working_minutes := round(extract(epoch from (new.punch_out - new.punch_in)) / 60);
    new.status := 'complete';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_compute_punch_working_minutes on public.teacher_punch_records;
create trigger trg_compute_punch_working_minutes
  before insert or update on public.teacher_punch_records
  for each row execute function public.compute_punch_working_minutes();

-- Reject punch-out before punch-in, and reject a second punch-in/out for a
-- day that's already been punched (duplicate prevention, per spec §14 — the
-- unique(teacher_id, punch_date) constraint stops a second ROW, this
-- trigger stops overwriting punch_in/punch_out once already set).
create or replace function public.enforce_punch_sequence()
returns trigger
language plpgsql
as $$
begin
  if new.punch_out is not null and new.punch_in is null then
    raise exception 'Cannot punch out before punching in';
  end if;

  if new.punch_out is not null and new.punch_out < new.punch_in then
    raise exception 'Punch out cannot be earlier than punch in';
  end if;

  -- The correction-approval function (apply_attendance_correction) sets
  -- this transaction-local flag deliberately before writing a correction,
  -- so an approved correction can actually change an already-recorded
  -- punch. Every other path (the teacher's own punch in/out) never sets
  -- it, so the immutability rule below still applies to them.
  if current_setting('auraed.correction_override', true) = 'true' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.punch_in is not null and new.punch_in is distinct from old.punch_in then
      raise exception 'Punch in is already recorded for this day and cannot be changed directly — submit a correction request instead';
    end if;
    if old.punch_out is not null and new.punch_out is distinct from old.punch_out then
      raise exception 'Punch out is already recorded for this day and cannot be changed directly — submit a correction request instead';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_punch_sequence on public.teacher_punch_records;
create trigger trg_enforce_punch_sequence
  before insert or update on public.teacher_punch_records
  for each row execute function public.enforce_punch_sequence();

-- Geofence enforcement: if the school has geofencing enabled, reject a
-- punch whose lat/lng falls outside the allowed radius. Uses the haversine
-- formula in plain SQL/plpgsql so this can never be bypassed by a client
-- that skips a JS-side check.
create or replace function public.enforce_geofence()
returns trigger
language plpgsql
as $$
declare
  v_enabled boolean;
  v_lat double precision;
  v_lng double precision;
  v_radius integer;
  v_distance_meters double precision;
  earth_radius_m constant double precision := 6371000;
begin
  select geofence_enabled, geofence_latitude, geofence_longitude, geofence_radius_meters
    into v_enabled, v_lat, v_lng, v_radius
  from public.school_settings
  where school_id = new.school_id;

  if v_enabled is not true then
    return new; -- geofencing not enabled for this school
  end if;

  if new.latitude is null or new.longitude is null then
    raise exception 'Location is required to punch in/out for this school';
  end if;

  if v_lat is null or v_lng is null or v_radius is null then
    return new; -- geofence enabled but not fully configured yet; don't block
  end if;

  v_distance_meters := 2 * earth_radius_m * asin(sqrt(
    power(sin(radians(new.latitude - v_lat) / 2), 2) +
    cos(radians(v_lat)) * cos(radians(new.latitude)) *
    power(sin(radians(new.longitude - v_lng) / 2), 2)
  ));

  if v_distance_meters > v_radius then
    raise exception 'You are % meters outside the allowed punch-in area (limit: % meters)',
      round(v_distance_meters - v_radius), v_radius;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_geofence on public.teacher_punch_records;
create trigger trg_enforce_geofence
  before insert or update on public.teacher_punch_records
  for each row execute function public.enforce_geofence();

drop trigger if exists trg_teacher_punch_updated_at on public.teacher_punch_records;
create trigger trg_teacher_punch_updated_at before update on public.teacher_punch_records
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_teacher_punch on public.teacher_punch_records;
create trigger trg_audit_teacher_punch
  after insert or update or delete on public.teacher_punch_records
  for each row execute function public.audit_row_change();

-- =========================================================================
-- ATTENDANCE CORRECTION REQUESTS
-- =========================================================================
create table if not exists public.attendance_correction_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  punch_record_id uuid references public.teacher_punch_records(id) on delete set null,
  punch_date date not null,
  requested_punch_in timestamptz,
  requested_punch_out timestamptz,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_correction_requests_school_id on public.attendance_correction_requests(school_id);
create index if not exists idx_correction_requests_teacher_id on public.attendance_correction_requests(teacher_id);

drop trigger if exists trg_correction_requests_updated_at on public.attendance_correction_requests;
create trigger trg_correction_requests_updated_at before update on public.attendance_correction_requests
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_correction_requests on public.attendance_correction_requests;
create trigger trg_audit_correction_requests
  after insert or update or delete on public.attendance_correction_requests
  for each row execute function public.audit_row_change();

-- Applying an approved correction updates (or creates) the underlying punch
-- record. This runs as a SECURITY DEFINER function called explicitly by the
-- approving School Admin (not a trigger), so the approval action and its
-- effect are one deliberate, auditable step.
create or replace function public.apply_attendance_correction(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
begin
  select * into v_request from public.attendance_correction_requests where id = p_request_id;

  if v_request is null then
    raise exception 'Correction request not found';
  end if;

  if not public.user_has_permission('attendance.edit') or v_request.school_id <> public.user_school_id() then
    raise exception 'Not authorized to approve this correction request';
  end if;

  perform set_config('auraed.correction_override', 'true', true);

  insert into public.teacher_punch_records (school_id, teacher_id, punch_date, punch_in, punch_out)
  values (v_request.school_id, v_request.teacher_id, v_request.punch_date, v_request.requested_punch_in, v_request.requested_punch_out)
  on conflict (teacher_id, punch_date) do update
    set punch_in = coalesce(excluded.punch_in, public.teacher_punch_records.punch_in),
        punch_out = coalesce(excluded.punch_out, public.teacher_punch_records.punch_out);

  perform set_config('auraed.correction_override', 'false', true);

  update public.attendance_correction_requests
  set status = 'approved', approved_by = auth.uid(), approved_at = now()
  where id = p_request_id;
end;
$$;

grant execute on function public.apply_attendance_correction(uuid) to authenticated;
