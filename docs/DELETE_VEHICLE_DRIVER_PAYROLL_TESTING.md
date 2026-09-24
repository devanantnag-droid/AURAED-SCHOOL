# Delete Vehicle + Driver Payroll — Testing checklist

## 1. Delete a vehicle

**Transport → Vehicles** → each vehicle now has a **Delete** button.
Type-to-confirm modal (same pattern used for deleting a school/student
elsewhere) — you must type the exact vehicle number to confirm.

What happens on delete:
- The vehicle itself is removed
- Its driver login is unlinked (not deleted — the driver's account
  still exists, just no longer tied to a vehicle)
- Any route using that vehicle keeps existing, just loses its vehicle
  assignment (you'll need to assign a different vehicle to it)
- Its location-tracking row is cleaned up automatically

### To test
Delete a test vehicle, confirm it disappears from the list, confirm any
route that used it still exists (Routes tab) but shows no vehicle, and
confirm the driver's login still exists (they just show as unassigned
until reassigned).

## 2. Driver payroll

Drivers can now go through the exact same Payroll flow as any teacher
or staff member — no separate driver-specific payroll system, just a
`staff` record linked to their login.

**New drivers** (created after this update): payroll is enabled
automatically the moment their login is created — no extra step.

**Existing drivers** (created before this update): go to **Transport →
Drivers**, find them, click **"Enable payroll for this driver"** —
one-time action per existing driver.

Once enabled, go to **Payroll** and set their salary structure exactly
like you would for a teacher or staff member. From there:
- Payslips generate the same way
- They'll automatically appear in **Reports → Payroll export** — no
  extra code was needed for this, since that report already worked
  generically across teachers and staff

### To test
1. For your existing test driver: Transport → Drivers → **Enable
   payroll for this driver**.
2. Confirm the message changes to "Payroll enabled — set salary in
   Payroll →" and the link takes you to the Payroll page.
3. In Payroll, find the driver (should appear under Staff, role title
   "Driver", department "Transport") and set a salary structure.
4. Generate a payslip for them the same way you would for any staff
   member.
5. Go to Reports → generate a Payroll export for that month — confirm
   the driver's payslip appears in the results.

### One honest scope note
"Reports" here specifically means Payroll — drivers don't have their
own attendance/punch-in system the way teachers do (they have location
sharing instead, which is a different concept), so there isn't a
"driver attendance report" to build. If you meant something more
specific by "reports" for drivers, let me know and I'll scope that
properly rather than guess further.
