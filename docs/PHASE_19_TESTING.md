# Phase 19 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0037_ptm.sql`
   - `supabase/migrations/0038_ptm_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **PTM** checked.

## 2. Create a PTM day and slots

Log in as School Admin → **PTM Scheduling** → **Sessions & Slots** tab.

- Create a PTM day: title "Term 1 PTM", pick a date.
- Confirm it's selected in the dropdown.
- Add a slot: pick a teacher, start time, end time. Click **Add slot**.
- Confirm it lists under "Slots" showing "Available".
- Add a second slot for the same or a different teacher.

## 3. Book a slot on a parent's behalf

- Switch to **Bookings** tab.
- Pick the PTM day, an available slot, a student, enter a parent name and
  phone.
- Click **Book slot**.
- Confirm a success message, and the booking appears under "All bookings"
  with the student, teacher, time, and parent name/phone.
- Go back to **Sessions & Slots** — confirm that slot now shows "Booked"
  instead of "Available", and no longer appears in the booking dropdown's
  available-slots list.

## 4. Double-booking prevention

- Try to book the **same slot again** (a different student/parent) — this
  should fail with an error, since a slot can only be booked once
  (enforced by a database unique constraint, not just the UI hiding it).

## 5. Cancel a booking

- Click **Cancel** next to the booking you made.
- Confirm it disappears from the list, and the slot goes back to
  "Available" in Sessions & Slots.

## 6. Teacher view

- Log in as the teacher whose slot you set up.
- Click **PTM** on their dashboard.
- Confirm they can see the PTM day, slots, and bookings (they have
  `ptm.view`), but do NOT see "New PTM day", "Add slot", or "Book slot"
  forms (those need `ptm.manage`, which teachers don't have).

## 7. Tenant isolation

- Confirm via console, logged in as School B, that `ptm_sessions`,
  `ptm_slots`, and `ptm_bookings` queries only ever return School B's
  rows.

Report back what passes/fails and we'll fix anything broken before Phase 20
(Reports & Export).
