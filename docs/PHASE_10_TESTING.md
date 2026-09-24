# Phase 10 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files (no new npm packages
   this time — `@react-pdf/renderer` from Phase 9 is reused for receipts).
2. Run the two new migrations in order:
   - `supabase/migrations/0018_fees_accounts.sql`
   - `supabase/migrations/0019_fees_accounts_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Fees** and **Accounts** checked
(Super Admin → Plans → Edit).

## 2. Set up fee categories and structures

Log in as School Admin → **Fees**.

- On the **Fee Categories** tab, add a category (e.g. "Tuition").
- Switch to **Fee Structures**, create one: pick the session, "Tuition"
  category, a class (e.g. "9"), amount (e.g. 5000), frequency "Monthly".
  Click **Add structure**.
- Confirm it lists correctly.

## 3. Assign the fee to students

- Click **Assign to students** next to the structure you just created.
- Confirm a success message shows how many students it was assigned to.
- Click it again — confirm it says something like "already assigned" (the
  unique constraint stops duplicate assignment, this is expected and
  correct, not a bug).

## 4. Record a payment

- Go to **Students** → click into a student in that class → scroll to the
  new **Fees** section on their profile.
- Confirm you see the fee line with the correct amount due and status
  "pending".
- Enter a partial amount (e.g. 2000), pick a payment method, click **Record
  payment**.
- Confirm the status flips to "partial", the balance updates correctly,
  and a receipt entry appears below with a real receipt number
  (`RCT-000001` or similar).
- Click **Receipt** next to it — confirm a real PDF downloads showing the
  receipt number, student name, amount, payment method, and date.
- Record a second payment for the remaining balance — confirm the status
  flips to "paid" and the balance shows ₹0.

## 5. Verify the automatic status computation

Run in SQL Editor:
```sql
select sf.status, sf.amount_paid, sf.amount_due, sf.discount
from public.student_fees sf
join public.students s on s.id = sf.student_id
where s.first_name = 'TEST'; -- or whichever student you used
```
Confirm `amount_paid` matches the sum of your payments and `status` is
correct — this is all computed by a database trigger, never set directly
by the app.

## 6. Accounts

- Go to **Accounts**.
- Confirm "Total income (fees)" already shows a number matching what you
  just collected.
- Add an expense category (e.g. "Utilities"), then record an expense (e.g.
  "Electricity bill", ₹1500).
- Confirm the expense list updates and "Total expenses" / "Net" recalculate
  correctly.
- Delete the expense, confirm it disappears and totals update.

## 7. Permission check

- If you have a non-Accountant, non-Admin test user (e.g. a Teacher),
  confirm they don't see Fees or Accounts in their sidebar at all.
- If you have an Accountant test user, confirm they can do everything
  above.

## 8. Tenant isolation

- Confirm via console, logged in as School B, that `fee_categories`,
  `fee_structures`, `student_fees`, `payments`, and `expenses` queries only
  ever return School B's rows.

Report back what passes/fails and we'll fix anything broken before Phase 11
(Payroll).
