-- AURAED SCHOOL — Phase 14: RLS for inventory
-- Run after 0027_inventory.sql.

alter table public.inventory_categories enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;

create policy inventory_categories_select on public.inventory_categories
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('inventory.view')));
create policy inventory_categories_write on public.inventory_categories
  for all using (school_id = public.user_school_id() and public.user_has_permission('inventory.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('inventory.manage'));
create policy inventory_categories_super_admin on public.inventory_categories
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy inventory_items_select on public.inventory_items
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('inventory.view')));
create policy inventory_items_write on public.inventory_items
  for all using (school_id = public.user_school_id() and public.user_has_permission('inventory.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('inventory.manage'));
create policy inventory_items_super_admin on public.inventory_items
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

create policy inventory_transactions_select on public.inventory_transactions
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('inventory.view')));
create policy inventory_transactions_write on public.inventory_transactions
  for all using (school_id = public.user_school_id() and public.user_has_permission('inventory.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('inventory.manage'));
create policy inventory_transactions_super_admin on public.inventory_transactions
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
