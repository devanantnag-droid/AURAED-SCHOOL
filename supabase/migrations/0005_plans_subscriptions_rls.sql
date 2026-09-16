-- AURAED SCHOOL — Phase 3: RLS for plans/features/subscriptions
-- Run after 0004_plans_subscriptions.sql.

alter table public.features enable row level security;
alter table public.plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

-- =========================================================================
-- FEATURES / PLANS / PLAN_FEATURES — catalog tables. Every authenticated
-- user can read them (a School Admin needs to see the plan catalog to
-- upgrade, and any user needs to know what features exist to render
-- "Upgrade Plan" prompts correctly). Only Super Admin can write.
-- =========================================================================
create policy features_select_all on public.features
  for select using (auth.role() = 'authenticated');

create policy features_write_super_admin on public.features
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

create policy plans_select_all on public.plans
  for select using (auth.role() = 'authenticated');

create policy plans_write_super_admin on public.plans
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

create policy plan_features_select_all on public.plan_features
  for select using (auth.role() = 'authenticated');

create policy plan_features_write_super_admin on public.plan_features
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- SUBSCRIPTIONS — Super Admin manages everything. Any member of a school
-- can read their own school's subscription (needed to show plan/status on
-- their dashboard and to gate features), but cannot write to it — plan
-- changes, activation, suspension are all Super Admin actions per spec §9.
-- =========================================================================
create policy subscriptions_select on public.subscriptions
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or school_id = public.user_school_id()
  );

create policy subscriptions_write_super_admin on public.subscriptions
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- SUBSCRIPTION_PAYMENTS — same shape: schools can view their own billing
-- history, only Super Admin can record/edit payments (real gateway
-- webhooks would also write here via a service-role Edge Function in a
-- later phase, same pattern as onboard-school-admin).
-- =========================================================================
create policy subscription_payments_select on public.subscription_payments
  for select
  using (
    public.user_has_role('SUPER_ADMIN')
    or school_id = public.user_school_id()
  );

create policy subscription_payments_write_super_admin on public.subscription_payments
  for all
  using (public.user_has_role('SUPER_ADMIN'))
  with check (public.user_has_role('SUPER_ADMIN'));
