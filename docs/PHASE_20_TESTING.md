# Phase 20 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the one new migration:
   - `supabase/migrations/0040_reports.sql`

   **Note**: this phase adds no new tables — reports and exports work off
   data already in your database from every prior phase. There's only one
   migration this time (just a permission), not the usual schema+RLS pair.
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Reports** checked.

## 2. Dashboard summary

Log in as School Admin → **Reports & Export** → you should land on the
**Dashboard** tab.

- Confirm you see cards for Active Students, Active Teachers, Active
  Staff, Attendance Today, Fees Collected (Month), Fees Pending, Low
  Stock Items, and Events (Next 7 Days).
- Spot-check a couple of numbers against what you know — e.g. if you
  marked attendance today in Phase 5 testing, does the percentage look
  right? If you've got fee payments this month from Phase 10 testing,
  does "Fees Collected" roughly match?

## 3. Export: Students

- Switch to the **Export** tab.
- Click **Export CSV** under "Students".
- Confirm a `students.csv` file downloads. Open it — confirm it has a
  header row and one row per student with admission number, name, class,
  section, status, phone.

## 4. Export: Attendance

- Pick a date range that includes a day you marked attendance on.
- Click **Export CSV**.
- Confirm `attendance.csv` downloads with the right columns and rows.
- Try a date range with no data — confirm you get a clear "No data found"
  message instead of an empty or broken file.

## 5. Export: Fee Collection

- Pick a date range covering a payment you recorded in Phase 10 testing.
- Export — confirm the CSV includes the receipt number, student, amount,
  and payment method.

## 6. Export: Exam Results

- Pick the exam you used in Phase 9 testing.
- Export — confirm the CSV includes each student's marks per subject.

## 7. Export: Payroll

- Pick the month/year you generated a payslip for in Phase 11 testing.
- Export — confirm the CSV includes the employee and net salary.

## 8. Permission check

- Confirm a role other than School Admin (e.g. Accountant, Teacher)
  doesn't see "Reports & Export" in their sidebar at all — this phase
  intentionally keeps it School-Admin-only given it's bulk data export.

## 9. Tenant isolation

- Log in as School B's admin, check the dashboard and a couple of
  exports — confirm every number and row reflects only School B's data,
  never School A's.

Report back what passes/fails — this is a big one to get right since it
touches nearly every table in the whole system. Once confirmed, Phase 21
(Settings & Branding) is next.
