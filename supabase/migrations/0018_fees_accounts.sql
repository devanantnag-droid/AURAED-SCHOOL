-- AURAED SCHOOL — Phase 10: Fees, Payments, Receipts, Accounts
-- Run after 0001-0017.

-- =========================================================================
-- FEE CATEGORIES
-- =========================================================================
create table if not exists public.fee_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

-- =========================================================================
-- FEE STRUCTURES — a fee category's amount for a given class + session.
-- class_id is nullable to allow a school-wide fee (e.g. Admission Fee)
-- that applies regardless of class.
-- =========================================================================
create table if not exists public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  fee_category_id uuid not null references public.fee_categories(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  amount numeric(10, 2) not null,
  frequency text not null default 'one_time' check (frequency in ('one_time', 'monthly', 'quarterly', 'annual')),
  due_day integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fee_structures_school_id on public.fee_structures(school_id);

-- =========================================================================
-- STUDENT FEES — an individual student's assigned fee (an "invoice line").
-- amount_paid and status are maintained automatically by a trigger on
-- payments, never set directly by the app.
-- =========================================================================
create table if not exists public.student_fees (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  fee_structure_id uuid not null references public.fee_structures(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  amount_due numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  amount_paid numeric(10, 2) not null default 0,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'partial', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, fee_structure_id)
);

create index if not exists idx_student_fees_school_id on public.student_fees(school_id);
create index if not exists idx_student_fees_student on public.student_fees(student_id);

-- =========================================================================
-- PAYMENTS — recording a payment against a student_fees line. A
-- human-readable receipt_number is generated automatically per school.
-- =========================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_fee_id uuid not null references public.student_fees(id) on delete cascade,
  receipt_number text not null,
  amount numeric(10, 2) not null,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'cheque', 'card', 'online', 'upi', 'bank_transfer')),
  transaction_id text,
  payment_date date not null default current_date,
  status text not null default 'success' check (status in ('success', 'pending', 'failed', 'refunded')),
  notes text,
  received_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (school_id, receipt_number)
);

create index if not exists idx_payments_school_id on public.payments(school_id);
create index if not exists idx_payments_student_fee on public.payments(student_fee_id);

-- Auto-generate a per-school sequential receipt number, e.g. RCT-000001,
-- if the app doesn't supply one.
create sequence if not exists public.receipt_number_seq;

create or replace function public.generate_receipt_number()
returns trigger
language plpgsql
as $$
begin
  if new.receipt_number is null or new.receipt_number = '' then
    new.receipt_number := 'RCT-' || lpad(nextval('public.receipt_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_receipt_number on public.payments;
create trigger trg_generate_receipt_number
  before insert on public.payments
  for each row execute function public.generate_receipt_number();

-- Recompute the parent student_fees row's amount_paid/status whenever a
-- payment is inserted, updated, or deleted — this is the ONLY place these
-- derived columns are ever written, so they can never drift out of sync
-- with the actual payment history.
create or replace function public.recompute_student_fee_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_fee_id uuid;
  v_total_paid numeric(10, 2);
  v_amount_payable numeric(10, 2);
begin
  v_student_fee_id := coalesce(new.student_fee_id, old.student_fee_id);

  select coalesce(sum(amount), 0) into v_total_paid
  from public.payments
  where student_fee_id = v_student_fee_id and status = 'success';

  select (amount_due - discount) into v_amount_payable
  from public.student_fees where id = v_student_fee_id;

  update public.student_fees
  set amount_paid = v_total_paid,
      status = case
        when v_total_paid >= v_amount_payable and v_amount_payable > 0 then 'paid'
        when v_total_paid > 0 then 'partial'
        else 'pending'
      end
  where id = v_student_fee_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recompute_student_fee_status on public.payments;
create trigger trg_recompute_student_fee_status
  after insert or update or delete on public.payments
  for each row execute function public.recompute_student_fee_status();

-- =========================================================================
-- EXPENSES (simple accounts/expense tracking — spec §28)
-- =========================================================================
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  expense_category_id uuid references public.expense_categories(id) on delete set null,
  description text not null,
  amount numeric(10, 2) not null,
  expense_date date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_school_id on public.expenses(school_id, expense_date);

-- =========================================================================
-- updated_at + audit triggers
-- =========================================================================
drop trigger if exists trg_fee_structures_updated_at on public.fee_structures;
create trigger trg_fee_structures_updated_at before update on public.fee_structures
  for each row execute function public.set_updated_at();

drop trigger if exists trg_student_fees_updated_at on public.student_fees;
create trigger trg_student_fees_updated_at before update on public.student_fees
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_student_fees on public.student_fees;
create trigger trg_audit_student_fees
  after insert or update or delete on public.student_fees
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_payments on public.payments;
create trigger trg_audit_payments
  after insert or update or delete on public.payments
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_expenses on public.expenses;
create trigger trg_audit_expenses
  after insert or update or delete on public.expenses
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('payments.view', 'View payments and receipts'),
  ('payments.create', 'Record payments'),
  ('accounts.view', 'View expenses and financial summaries'),
  ('accounts.manage', 'Record and edit expenses')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('payments.view', 'payments.create', 'accounts.view', 'accounts.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'ACCOUNTANT' and p.code in ('payments.view', 'payments.create', 'accounts.view', 'accounts.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('PARENT', 'STUDENT') and p.code = 'payments.view'
on conflict do nothing;
