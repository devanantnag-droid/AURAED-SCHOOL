-- AURAED SCHOOL — Phase 3: Plans, Features, Subscriptions
-- Run after 0001, 0002, 0003.

-- =========================================================================
-- FEATURES — a fixed-ish catalog of gate-able modules. Super Admin can add
-- more later via the UI; this seed covers everything the later phases
-- (5 onward) will actually gate.
-- =========================================================================
create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

insert into public.features (code, name, description) values
  ('student_management', 'Student Management', 'Student records, admissions, profiles'),
  ('parent_management', 'Parent Management', 'Parent accounts and linking'),
  ('teacher_management', 'Teacher Management', 'Teacher records and profiles'),
  ('staff_management', 'Staff Management', 'Non-teaching staff records'),
  ('attendance', 'Attendance', 'Student attendance tracking'),
  ('teacher_punch', 'Teacher Punch In/Out', 'Teacher attendance via punch in/out'),
  ('timetable', 'Timetable', 'Class and teacher timetables'),
  ('homework', 'Homework', 'Homework assignment and tracking'),
  ('assignments', 'Assignments', 'Gradable assignments and submissions'),
  ('study_materials', 'Study Materials', 'Uploaded learning resources'),
  ('exams', 'Exams', 'Exam scheduling'),
  ('results', 'Results & Report Cards', 'Marks, grading, report cards'),
  ('fees', 'Fees', 'Fee structures, payments, receipts'),
  ('accounts', 'Accounts', 'Income/expense tracking'),
  ('payroll', 'Payroll', 'Staff salary and payslips'),
  ('library', 'Library', 'Book catalog and issue/return'),
  ('transport', 'Transport', 'Vehicles, routes, stops'),
  ('inventory', 'Inventory', 'Stock and asset tracking'),
  ('admissions', 'Admissions', 'Enquiry-to-admission pipeline'),
  ('announcements', 'Announcements', 'Targeted announcements'),
  ('messaging', 'Messaging/Chat', 'Internal messaging'),
  ('events', 'Events & Calendar', 'School calendar and events'),
  ('ptm', 'PTM', 'Parent-teacher meeting scheduling'),
  ('certificates', 'Certificates', 'Certificate generation'),
  ('id_cards', 'ID Cards', 'ID card generation'),
  ('reports', 'Reports', 'Reporting and export')
on conflict (code) do nothing;

-- =========================================================================
-- PLANS — fully Super-Admin managed, nothing hard-coded in the app besides
-- this table. Seed intentionally left empty; create plans from the UI.
-- =========================================================================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12, 2) not null default 0,
  currency text not null default 'INR',
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  trial_days integer not null default 14,
  max_students integer,
  max_teachers integer,
  max_staff integer,
  storage_limit_mb integer,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_features (
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  primary key (plan_id, feature_id)
);

-- =========================================================================
-- SUBSCRIPTIONS — one row per school (a school's subscription changes plan
-- over time rather than creating a new row each time, matching spec §9's
-- "Change Plan" action; history of plan changes is captured via audit_logs
-- since every update to this table is auto-audited).
-- =========================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null unique references public.schools(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'trial'
    check (status in ('trial', 'active', 'suspended', 'cancelled')),
  start_date date not null default current_date,
  end_date date,
  trial_ends_at date,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_school_id on public.subscriptions(school_id);
create index if not exists idx_subscriptions_plan_id on public.subscriptions(plan_id);

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  amount numeric(12, 2) not null,
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method text,
  transaction_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscription_payments_school_id on public.subscription_payments(school_id);

-- =========================================================================
-- updated_at triggers
-- =========================================================================
drop trigger if exists trg_plans_updated_at on public.plans;
create trigger trg_plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Reuse the generic audit trigger from Phase 2 on the tables that matter
-- most for compliance/history: plans and subscriptions.
-- =========================================================================
drop trigger if exists trg_audit_plans on public.plans;
create trigger trg_audit_plans
  after insert or update or delete on public.plans
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_subscriptions on public.subscriptions;
create trigger trg_audit_subscriptions
  after insert or update or delete on public.subscriptions
  for each row execute function public.audit_row_change();

-- =========================================================================
-- HELPER FUNCTIONS
-- =========================================================================

-- Effective status layers expiry/expiring detection on top of the stored
-- administrative status, without needing a cron job to "flip" rows. An
-- explicit suspended/cancelled status always wins (Super Admin override).
create or replace function public.subscription_effective_status(p_school_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when s.status in ('suspended', 'cancelled') then s.status
    when s.end_date is not null and s.end_date < current_date then 'expired'
    when s.end_date is not null and s.end_date - current_date <= 7 then 'expiring'
    when s.status = 'trial' and s.trial_ends_at is not null and s.trial_ends_at < current_date then 'expired'
    else s.status
  end
  from public.subscriptions s
  where s.school_id = p_school_id;
$$;

grant execute on function public.subscription_effective_status(uuid) to authenticated;

-- Does the CALLER's school currently have access to this feature?
-- Super Admin always has access (platform management doesn't need a plan).
-- A school with no subscription row at all has no access to anything.
create or replace function public.school_has_feature(feature_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.user_has_role('SUPER_ADMIN')
    or exists (
      select 1
      from public.subscriptions s
      join public.plan_features pf on pf.plan_id = s.plan_id
      join public.features f on f.id = pf.feature_id
      where s.school_id = public.user_school_id()
        and f.code = feature_code
        and public.subscription_effective_status(s.school_id) in ('trial', 'active', 'expiring')
    );
$$;

grant execute on function public.school_has_feature(text) to authenticated;
