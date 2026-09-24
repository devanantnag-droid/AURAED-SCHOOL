# Phase 18 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0035_events.sql`
   - `supabase/migrations/0036_events_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Events & Calendar** checked.

## 2. Create a school-wide event

Log in as School Admin → **Events & Calendar**.

- Title "Annual Sports Day", pick a date, start/end time, location, target
  "Everyone".
- Click **Create event**.
- Confirm it appears in the list with date, time, location, and
  "Everyone" all shown correctly.

## 3. RSVP

- Click **Going** on the event you just created — confirm the button
  highlights to show it's selected.
- Click **View RSVPs** (only visible to you as the manager) — confirm it
  shows "Going 1 · Maybe 0 · Can't go 0".
- Log in as a teacher, RSVP "Maybe" to the same event.
- Back as School Admin, click **View RSVPs** again — confirm it now shows
  "Going 1 · Maybe 1 · Can't go 0".

## 4. Role-targeted event

- Post one targeted at role "TEACHER" only (e.g. "Staff training day").
- Confirm a teacher can see and RSVP to it.
- If you have another role's login, confirm they can't see it.

## 5. Class-targeted event

- Post one targeted at a specific class.
- Confirm a teacher assigned to that class can see it; one who isn't
  assigned cannot (same precision check as Phase 17's announcements).

## 6. Tenant isolation

- Confirm via console, logged in as School B, that `events` and
  `event_rsvps` queries only ever return School B's rows.

Report back what passes/fails and we'll fix anything broken before Phase 19
(PTM Scheduling).
