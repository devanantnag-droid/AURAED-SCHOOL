-- AURAED SCHOOL — Phase 11: Payroll
-- Run after 0001-0019.
--
-- Payroll applies to both teaching staff (teachers) and non-teaching staff
-- (staff) — rather than duplicate every table, each payroll table has
-- nullable teacher_id/staff_id columns with a check constraint requiring
-- exactly one to be set, and partial unique indexes keep one payslip per
-- employee per month regardless of which table they belong to.

-- =========================================================================
-- SALARY STRUCTURES — one active structure per employee. A new structure
-- effective_from a later date supersedes the old one for future payslips;
-- past payslips already generated keep their own recorded figures.
-- =========================================================================
create table if not exists public.salary_structures (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  basic_salary numeric(10, 2) not null,
  allowances numeric(10, 2) not null default 0,
  deductions numeric(10, 2) not null default 0,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(teacher_id, staff_id) = 1)
);

create index if not exists idx_salary_structures_school_id on public.salary_structures(school_id);
create unique index if not exists idx_salary_structures_one_per_teacher
  on public.salary_structures(teacher_id) where teacher_id is not null;
create unique index if not exists idx_salary_structures_one_per_staff
  on public.salary_structures(staff_id) where staff_id is not null;

-- =========================================================================
-- PAYSLIPS
-- =========================================================================
create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  period_month smallint not null check (period_month between 1 and 12),
  period_year smallint not null,
  basic_salary numeric(10, 2) not null,
  allowances numeric(10, 2) not null default 0,
  deductions numeric(10, 2) not null default 0,
  additional_deduction numeric(10, 2) not null default 0,
  net_salary numeric(10, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  payment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(teacher_id, staff_id) = 1)
);

create index if not exists idx_payslips_school_id on public.payslips(school_id);
create unique index if not exists idx_payslips_one_per_teacher_period
  on public.payslips(teacher_id, period_month, period_year) where teacher_id is not null;
create unique index if not exists idx_payslips_one_per_staff_period
  on public.payslips(staff_id, period_month, period_year) where staff_id is not null;

-- Net salary is always derived, never entered directly.
create or replace function public.compute_net_salary()
returns trigger
language plpgsql
as $$
begin
  new.net_salary := new.basic_salary + new.allowances - new.deductions - new.additional_deduction;
  return new;
end;
$$;

drop trigger if exists trg_compute_net_salary on public.payslips;
create trigger trg_compute_net_salary
  before insert or update on public.payslips
  for each row execute function public.compute_net_salary();

drop trigger if exists trg_salary_structures_updated_at on public.salary_structures;
create trigger trg_salary_structures_updated_at before update on public.salary_structures
  for each row execute function public.set_updated_at();

drop trigger if exists trg_payslips_updated_at on public.payslips;
create trigger trg_payslips_updated_at before update on public.payslips
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_payslips on public.payslips;
create trigger trg_audit_payslips
  after insert or update or delete on public.payslips
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions — HR_MANAGER (seeded since Phase 1 but unused until now)
-- is the natural owner of payroll, alongside School Admin.
-- =========================================================================
insert into public.permissions (code, description) values
  ('payroll.view', 'View salary structures and payslips'),
  ('payroll.manage', 'Create/edit salary structures and generate payslips')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('payroll.view', 'payroll.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'HR_MANAGER' and p.code in ('payroll.view', 'payroll.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'ACCOUNTANT' and p.code = 'payroll.view'
on conflict do nothing;
