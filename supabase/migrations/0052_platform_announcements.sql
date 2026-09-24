-- AURAED SCHOOL — Phase 29: Platform-wide Announcements (Super Admin)
-- Run after 0001-0051.
--
-- Deliberately a separate table from `announcements` (Phase 17), which is
-- tightly scoped to one school at a time. Rather than adding a nullable
-- school_id and reworking that table's well-tested RLS, this is its own
-- simple table: Super Admin broadcasts, every school's users can see it.

create table if not exists public.platform_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_type text not null default 'all' check (target_type in ('all', 'role')),
  target_role text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

drop trigger if exists trg_audit_platform_announcements on public.platform_announcements;
create trigger trg_audit_platform_announcements
  after insert or update or delete on public.platform_announcements
  for each row execute function public.audit_row_change();

alter table public.platform_announcements enable row level security;

-- Every authenticated user can see one that targets them — no school_id
-- scoping, since this is platform-wide by definition.
create policy platform_announcements_select on public.platform_announcements
  for select using (
    target_type = 'all'
    or (
      target_type = 'role'
      and exists (
        select 1 from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid() and r.name = platform_announcements.target_role
      )
    )
  );

create policy platform_announcements_write on public.platform_announcements
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- Notify every affected user across every school. Skips Super Admin's own
-- platform-level user_roles rows (school_id is null there, and
-- notifications.school_id is not-null) — they don't need a notification
-- for their own broadcast anyway.
-- =========================================================================
create or replace function public.trg_notify_platform_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.target_type = 'all' then
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select ur.school_id, ur.user_id, 'platform_announcement', new.title, left(new.body, 200), null
    from public.user_roles ur
    where ur.school_id is not null;
  elsif new.target_type = 'role' then
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select ur.school_id, ur.user_id, 'platform_announcement', new.title, left(new.body, 200), null
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.school_id is not null and r.name = new.target_role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_platform_announcement_notify on public.platform_announcements;
create trigger trg_platform_announcement_notify
  after insert on public.platform_announcements
  for each row execute function public.trg_notify_platform_announcement();
