# Driver Management + Student/Parent Responsive Polish — Testing checklist

## 1. Driver management in School Admin

**Transport → Drivers** (new tab) shows every vehicle that currently has
a driver, with their name, email, phone, and assigned route. From there
you can:
- **Reassign** a driver to a different vehicle (dropdown + button)
- **Reset password** (reuses the same modal as Teachers/Students/Parents)
- **Remove** — unlinks the driver from that vehicle without deleting
  their account, so they can be reassigned elsewhere later

### Important — redeploy required
Resetting a driver's password needed a change to the existing
`admin-reset-password` edge function (it only recognized Teacher/
Student/Parent before). This one needs redeploying:
```powershell
supabase functions deploy admin-reset-password
```
Without this step, "Reset password" for a driver will fail with an
authorization error — everything else in this update works without a
redeploy.

### To test
1. Deploy the function above.
2. Go to **Transport → Drivers** — confirm your existing test driver
   shows up with correct name/email/phone/vehicle.
3. Try **Reset password** — confirm it succeeds and the driver can log
   in with the new password.
4. Try **Reassign** to a different vehicle — confirm the driver now
   shows under the new vehicle, and their old vehicle no longer has a
   driver (visible back in the Vehicles tab).
5. Try **Remove** — confirm the vehicle now shows "Create driver login"
   again in the Vehicles tab, and the old account still exists (just
   unlinked) — reassign it to a vehicle again to confirm it still works.

### Known scope note
The driver list currently requires the viewer to have the SCHOOL_ADMIN
role specifically to see driver contact details (name/email/phone) —
a Transport Manager with `transport.manage` permission but not the
School Admin role will see the list but with blank contact fields, due
to how the underlying profile-visibility rule is scoped. Worth a
follow-up if Transport Manager is a role you actually use day-to-day.

## 2. Student/Parent web responsiveness

Two concrete improvements, not a full sidebar rebuild — Student/Parent's
actual feature set is already consolidated into tabs on one page, unlike
School Admin's ~30 separate sections, so a matching sidebar wouldn't
actually fit their smaller surface area. What was genuinely missing:

- **Network indicator** added to the Student/Parent header, matching
  School Admin's
- **The tab row** (Overview/Grievances/Leave/Surveys) now scrolls
  horizontally instead of wrapping awkwardly or overflowing on a narrow
  browser window

### To test
Open the student or parent portal in a browser, narrow the window
(or use responsive dev tools at ~375px width) — confirm:
- The header doesn't overlap or clip anything
- The tab row scrolls smoothly instead of breaking the layout
- The network indicator is tappable and shows the same detail panel as
  School Admin's
