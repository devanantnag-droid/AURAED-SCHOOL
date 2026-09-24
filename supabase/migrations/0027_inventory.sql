-- AURAED SCHOOL — Phase 14: Inventory
-- Run after 0001-0026.

-- =========================================================================
-- INVENTORY CATEGORIES
-- =========================================================================
create table if not exists public.inventory_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

-- =========================================================================
-- INVENTORY ITEMS — quantity_in_stock is maintained automatically by the
-- transaction trigger below, never set directly by the app.
-- =========================================================================
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  category_id uuid references public.inventory_categories(id) on delete set null,
  name text not null,
  sku text,
  unit text,
  quantity_in_stock integer not null default 0 check (quantity_in_stock >= 0),
  reorder_level integer not null default 0,
  unit_price numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inventory_items_school_id on public.inventory_items(school_id);

-- =========================================================================
-- INVENTORY TRANSACTIONS — every stock movement, purchase/issue/
-- return/adjustment. quantity is always a positive number; the
-- transaction_type determines whether it adds to or subtracts from stock.
-- =========================================================================
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('purchase', 'issue', 'return', 'adjustment')),
  quantity integer not null check (quantity > 0),
  vendor text,
  issued_to text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_transactions_school_id on public.inventory_transactions(school_id);
create index if not exists idx_inventory_transactions_item on public.inventory_transactions(item_id);

-- Adjust stock automatically. purchase/return add to stock; issue
-- subtracts (and is rejected if it would take stock negative — the
-- quantity_in_stock >= 0 check constraint on inventory_items enforces
-- this at the database level regardless of what the trigger computes).
-- 'adjustment' is a signed correction entered as a positive "set to"
-- delta by the caller's choice of direction — for simplicity here,
-- adjustment always ADDS quantity (use a separate negative-adjustment
-- convention client-side by issuing instead, if reducing stock).
create or replace function public.apply_inventory_transaction()
returns trigger
language plpgsql
as $$
begin
  if new.transaction_type in ('purchase', 'return', 'adjustment') then
    update public.inventory_items
    set quantity_in_stock = quantity_in_stock + new.quantity
    where id = new.item_id;
  elsif new.transaction_type = 'issue' then
    update public.inventory_items
    set quantity_in_stock = quantity_in_stock - new.quantity
    where id = new.item_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_apply_inventory_transaction on public.inventory_transactions;
create trigger trg_apply_inventory_transaction
  after insert on public.inventory_transactions
  for each row execute function public.apply_inventory_transaction();

drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
create trigger trg_inventory_items_updated_at before update on public.inventory_items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_inventory_items on public.inventory_items;
create trigger trg_audit_inventory_items
  after insert or update or delete on public.inventory_items
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_inventory_transactions on public.inventory_transactions;
create trigger trg_audit_inventory_transactions
  after insert or update or delete on public.inventory_transactions
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('inventory.view', 'View inventory items and transactions'),
  ('inventory.manage', 'Manage inventory items and record transactions')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('inventory.view', 'inventory.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'ACCOUNTANT' and p.code = 'inventory.view'
on conflict do nothing;
