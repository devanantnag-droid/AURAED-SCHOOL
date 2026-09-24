-- AURAED SCHOOL — Phase 16: Certificates & ID Cards
-- Run after 0001-0030.
--
-- ID cards are generated on-the-fly from existing student/teacher/staff
-- data (no new table needed — nothing about an ID card needs to persist
-- beyond the data already on file). Certificates DO get a persisted audit
-- trail below, since a certificate is a formal document a school may need
-- to prove it issued later.

-- =========================================================================
-- CERTIFICATE TEMPLATES — lets a school customize the wording per
-- certificate type. body_template holds placeholders like
-- {{student_name}}, {{class}}, {{admission_number}}, {{date}} that the
-- app substitutes at generation time.
-- =========================================================================
create table if not exists public.certificate_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  certificate_type text not null default 'custom'
    check (certificate_type in ('bonafide', 'transfer', 'character', 'custom')),
  body_template text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_certificate_templates_school_id on public.certificate_templates(school_id);

-- =========================================================================
-- ISSUED CERTIFICATES — an audit trail of every certificate actually
-- generated, with an auto-numbered certificate_number (same sequential
-- pattern as Phase 10's receipt numbers).
-- =========================================================================
create table if not exists public.issued_certificates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  template_id uuid references public.certificate_templates(id) on delete set null,
  certificate_type text not null,
  certificate_number text not null,
  body_text text not null,
  issued_date date not null default current_date,
  issued_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (school_id, certificate_number)
);

create index if not exists idx_issued_certificates_school_id on public.issued_certificates(school_id);
create index if not exists idx_issued_certificates_student on public.issued_certificates(student_id);

create sequence if not exists public.certificate_number_seq;

create or replace function public.generate_certificate_number()
returns trigger
language plpgsql
as $$
begin
  if new.certificate_number is null or new.certificate_number = '' then
    new.certificate_number := 'CERT-' || lpad(nextval('public.certificate_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_certificate_number on public.issued_certificates;
create trigger trg_generate_certificate_number
  before insert on public.issued_certificates
  for each row execute function public.generate_certificate_number();

drop trigger if exists trg_certificate_templates_updated_at on public.certificate_templates;
create trigger trg_certificate_templates_updated_at before update on public.certificate_templates
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_issued_certificates on public.issued_certificates;
create trigger trg_audit_issued_certificates
  after insert or update or delete on public.issued_certificates
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('certificates.view', 'View certificate templates and issued certificates'),
  ('certificates.manage', 'Manage templates and issue certificates')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('certificates.view', 'certificates.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'RECEPTIONIST' and p.code in ('certificates.view', 'certificates.manage')
on conflict do nothing;
