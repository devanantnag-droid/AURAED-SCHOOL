-- AURAED SCHOOL — Phase 15: Admissions
-- Run after 0001-0028.

-- =========================================================================
-- ADMISSIONS
-- =========================================================================
create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid references public.academic_sessions(id) on delete set null,
  applicant_first_name text not null,
  applicant_last_name text not null,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  parent_name text,
  parent_phone text,
  parent_email text,
  applying_for_class_id uuid references public.classes(id) on delete set null,
  status text not null default 'enquiry'
    check (status in ('enquiry', 'applied', 'under_review', 'approved', 'rejected', 'admitted')),
  interview_date date,
  interview_notes text,
  remarks text,
  converted_student_id uuid references public.students(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admissions_school_id on public.admissions(school_id);
create index if not exists idx_admissions_status on public.admissions(school_id, status);

-- =========================================================================
-- ADMISSION DOCUMENTS
-- =========================================================================
create table if not exists public.admission_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  admission_id uuid not null references public.admissions(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_admission_documents_admission on public.admission_documents(admission_id);

drop trigger if exists trg_admissions_updated_at on public.admissions;
create trigger trg_admissions_updated_at before update on public.admissions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_admissions on public.admissions;
create trigger trg_audit_admissions
  after insert or update or delete on public.admissions
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions — RECEPTIONIST (already exists, previously only granted
-- view rights on a few modules) becomes the natural front-desk owner here.
-- =========================================================================
insert into public.permissions (code, description) values
  ('admissions.view', 'View admission applicants'),
  ('admissions.manage', 'Manage admission applicants, interviews, and conversion to student')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('admissions.view', 'admissions.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'RECEPTIONIST' and p.code in ('admissions.view', 'admissions.manage')
on conflict do nothing;

-- =========================================================================
-- Storage bucket for admission documents — same private-bucket, per-school
-- folder pattern established in Phase 8.
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('admissions', 'admissions', false)
on conflict (id) do nothing;

create policy admissions_files_select on storage.objects
  for select using (
    bucket_id = 'admissions'
    and (
      public.user_has_role('SUPER_ADMIN')
      or (storage.foldername(name))[1] = public.user_school_id()::text
    )
  );

create policy admissions_files_insert on storage.objects
  for insert
  with check (bucket_id = 'admissions' and (storage.foldername(name))[1] = public.user_school_id()::text);

create policy admissions_files_delete on storage.objects
  for delete using (bucket_id = 'admissions' and (storage.foldername(name))[1] = public.user_school_id()::text);
