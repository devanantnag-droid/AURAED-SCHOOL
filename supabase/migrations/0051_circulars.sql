-- AURAED SCHOOL — Phase 28: Circulars
-- Run after 0001-0050.
--
-- Distinct from Announcements (Phase 17): a circular is a formal,
-- numbered notice from School Admin, often with a PDF attachment, kept
-- separate from casual day-to-day announcements even though the
-- targeting mechanics (all/role/class) are identical and reuse the same
-- pattern for consistency.

create table if not exists public.circulars (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  circular_number text not null,
  title text not null,
  body text not null,
  attachment_path text,
  target_type text not null default 'all' check (target_type in ('all', 'role', 'class')),
  target_role text,
  target_class_id uuid references public.classes(id) on delete set null,
  issued_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (school_id, circular_number)
);

create index if not exists idx_circulars_school on public.circulars(school_id);

-- Auto-numbered CIR-000001, same pattern as certificates/receipts.
create sequence if not exists public.circular_number_seq;

create or replace function public.generate_circular_number()
returns trigger
language plpgsql
as $$
begin
  if new.circular_number is null or new.circular_number = '' then
    new.circular_number := 'CIR-' || lpad(nextval('public.circular_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_circular_number on public.circulars;
create trigger trg_generate_circular_number
  before insert on public.circulars
  for each row execute function public.generate_circular_number();

drop trigger if exists trg_audit_circulars on public.circulars;
create trigger trg_audit_circulars
  after insert or update or delete on public.circulars
  for each row execute function public.audit_row_change();

-- =========================================================================
-- Storage — a private bucket for circular attachments (PDFs), same
-- per-school-folder pattern as every other document bucket.
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('circulars', 'circulars', false)
on conflict (id) do nothing;

create policy circulars_files_select on storage.objects
  for select using (
    bucket_id = 'circulars'
    and (public.user_has_role('SUPER_ADMIN') or (storage.foldername(name))[1] = public.user_school_id()::text)
  );

create policy circulars_files_insert on storage.objects
  for insert with check (
    bucket_id = 'circulars' and (storage.foldername(name))[1] = public.user_school_id()::text
  );

create policy circulars_files_delete on storage.objects
  for delete using (
    bucket_id = 'circulars' and (storage.foldername(name))[1] = public.user_school_id()::text
  );

-- =========================================================================
-- Permissions — everyone at the school can view circulars (they're
-- official notices meant to reach people), only School Admin issues them.
-- =========================================================================
insert into public.permissions (code, description) values
  ('circulars.view', 'View circulars issued by the school'),
  ('circulars.manage', 'Issue circulars')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'ACCOUNTANT', 'LIBRARIAN', 'RECEPTIONIST', 'TRANSPORT_MANAGER', 'HR_MANAGER')
  and p.code = 'circulars.view'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code = 'circulars.manage'
on conflict do nothing;

-- =========================================================================
-- RLS — same all/role/class targeting shape as announcements/events,
-- including reaching students/parents in a targeted class (the fix from
-- Phase 24's migration 0047).
-- =========================================================================
alter table public.circulars enable row level security;

create policy circulars_select on public.circulars
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (
      school_id = public.user_school_id()
      and public.user_has_permission('circulars.view')
      and (
        target_type = 'all'
        or (
          target_type = 'role'
          and exists (
            select 1 from public.user_roles ur
            join public.roles r on r.id = ur.role_id
            where ur.user_id = auth.uid() and r.name = circulars.target_role
          )
        )
        or (
          target_type = 'class'
          and (
            public.user_has_role('SCHOOL_ADMIN')
            or exists (select 1 from public.class_teachers ct where ct.class_id = circulars.target_class_id and ct.teacher_id = public.current_teacher_id())
            or exists (select 1 from public.subject_teachers st where st.class_id = circulars.target_class_id and st.teacher_id = public.current_teacher_id())
            or exists (select 1 from public.students s where s.id = public.current_student_id() and s.class_id = circulars.target_class_id)
            or exists (select 1 from public.students s where public.is_parent_of(s.id) and s.class_id = circulars.target_class_id)
          )
        )
      )
    )
  );

create policy circulars_insert on public.circulars
  for insert with check (
    school_id = public.user_school_id()
    and public.user_has_permission('circulars.manage')
    and issued_by = auth.uid()
  );

create policy circulars_delete on public.circulars
  for delete using (school_id = public.user_school_id() and public.user_has_permission('circulars.manage'));

-- =========================================================================
-- Notify targeted users, reusing Phase 25's shared targeting helper —
-- no need to re-derive the all/role/class recipient logic again.
-- =========================================================================
create or replace function public.trg_notify_circular()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_targeted_users(
    new.school_id, new.target_type, new.target_role, new.target_class_id,
    'circular', new.circular_number || ': ' || new.title, left(new.body, 200), '/school/circulars'
  );
  return new;
end;
$$;

drop trigger if exists trg_circular_notify on public.circulars;
create trigger trg_circular_notify
  after insert on public.circulars
  for each row execute function public.trg_notify_circular();
