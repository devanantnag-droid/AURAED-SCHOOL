# Phase 14 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0027_inventory.sql`
   - `supabase/migrations/0028_inventory_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Inventory** checked.

## 2. Add a category and an item

Log in as School Admin → **Inventory** → **Items** tab.

- Add a category (e.g. "Stationery").
- Add an item: name "A4 Paper Ream", category "Stationery", unit "reams",
  reorder level **5**, unit price optional.
- Confirm it lists with "0 reams in stock" and a low-stock warning (since
  0 ≤ reorder level of 5).

## 3. Record a purchase

- Switch to **Transactions** tab.
- Pick the item, type "Purchase", quantity 20, vendor "ABC Suppliers",
  click **Record transaction**.
- Confirm it appears in the recent transactions list.
- Go back to **Items** — confirm stock now shows "20 reams in stock" and
  the low-stock warning is gone (20 > reorder level 5).

## 4. Record an issue

- Record a transaction: type "Issue", quantity 18, issued to "Class 9-A".
- Confirm stock drops to "2 reams in stock" and the low-stock warning
  reappears (2 ≤ 5).

## 5. Test the stock-can't-go-negative protection

- Try issuing 10 more (more than the 2 remaining) — this should fail with
  a database error (a check constraint preventing negative stock), not
  silently show a negative number.
- Confirm via SQL if you want to be thorough:
  ```sql
  select name, quantity_in_stock from public.inventory_items where name = 'A4 Paper Ream';
  ```
  Should still show 2, unaffected by the failed attempt.

## 6. Permission check

- Confirm an Accountant test user can **view** inventory (they were
  granted `inventory.view`) but can't add items or record transactions
  (no `inventory.manage`).
- Confirm a role without `inventory.view` doesn't see Inventory in their
  sidebar.

## 7. Tenant isolation

- Confirm via console, logged in as School B, that `inventory_categories`,
  `inventory_items`, and `inventory_transactions` queries only ever return
  School B's rows.

Report back what passes/fails and we'll fix anything broken before Phase 15
(Admissions).
