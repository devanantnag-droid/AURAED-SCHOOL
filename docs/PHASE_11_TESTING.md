# Phase 11 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0020_payroll.sql`
   - `supabase/migrations/0021_payroll_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Payroll** checked.

## 2. Set up a salary structure

Log in as School Admin → **Payroll** → **Salary Structures** tab.

- Pick an employee (a teacher or staff member).
- Enter basic salary (e.g. 30000), allowances (e.g. 2000), deductions (e.g. 500).
- Click **Save salary structure**.
- Switch to a different employee, confirm the form clears/loads their own
  (empty) values rather than showing the previous employee's numbers.
- Switch back to the first employee, confirm their saved values reload.

## 3. Generate a payslip

- Switch to the **Payslips** tab.
- Pick the same employee, current month/year, leave extra deduction as 0.
- Click **Generate payslip**.
- Confirm it appears in the list with the correct net salary
  (basic + allowances - deductions).
- Try generating a **second** payslip for the same employee and the same
  month/year — this should fail (one payslip per employee per period is
  enforced by a database constraint).
- Try generating one for an employee with **no salary structure set up** —
  confirm you get a clear error message, not a silent failure or a payslip
  with zero values.

## 4. Download the PDF

- Click **PDF** next to the payslip you generated.
- Confirm a real PDF downloads showing employee name, period, basic
  salary, allowances, deductions, net salary, and status.

## 5. Mark as paid

- Click **Mark paid** — confirm the status badge flips to "paid" and the
  button disappears (can't be un-paid from the UI, matching the spec's
  intent — status is one-directional here for simplicity).

## 6. Teacher self-service view

- Log in as a teacher who has a salary structure and a generated payslip.
- Click **My Payslips** on their dashboard.
- Confirm they land on the Payroll page, and the **Payslips** tab shows
  **only their own** payslip(s) — not other employees' — even though
  there's no explicit filter in the UI for this (it's enforced by RLS).
- Confirm they do NOT see "Generate payslip" or "Mark paid" controls
  (those require `payroll.manage`, which teachers don't have).
- Confirm the **Salary Structures** tab shows a permission message instead
  of the form.

## 7. Tenant isolation

- Confirm via console, logged in as School B, that `salary_structures` and
  `payslips` queries only ever return School B's rows.

Report back what passes/fails and we'll fix anything broken before Phase 12
(Library).
