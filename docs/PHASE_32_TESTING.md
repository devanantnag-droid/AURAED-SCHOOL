# Phase 32 — Testing checklist (Leave routing, announcement deletion, circular bug fix)

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the new migration:
   - `supabase/migrations/0053_leave_routing_fix.sql`
3. `npm run supabase:types`
4. Restart `npm run dev`, hard-refresh.

## 1. Student leave now goes to the class teacher

- As a student in a class with a class-teacher assigned, submit a leave
  request.
- Log in as **that class's in-charge teacher** — confirm a new "Student
  leave requests to review" section appears on their dashboard, and
  confirm they got a notification the moment the student submitted it.
- Approve or reject it — confirm the student gets notified either way.
- Log in as **School Admin** → Leave Management → confirm the student's
  request is still visible (for oversight) but shows "Awaiting the class
  in-charge teacher's decision" instead of buttons, once pending, and the
  correct final status once decided.

## 2. Teacher leave still goes to School Admin (unchanged)

Submit a teacher leave request → confirm it still shows up with
Approve/Reject buttons on School Admin's Leave Management page, exactly
as before — this path wasn't meant to change.

## 3. A teacher who isn't a class in-charge

Confirm a teacher with no class-teacher assignment sees no "Student leave
requests to review" section at all (not an empty one — it should not
render).

## 4. Delete a platform announcement

Log in as Super Admin → Platform Announcements → **Delete** on one you
created → confirm it disappears from the list immediately.
Log in as School Admin → confirm it's also gone from their "Platform
notices" dashboard card.

## 5. The circular notification bug — confirm the fix

Issue a circular targeted at "Everyone" (or a class a student belongs
to) → log in as that student → click the notification bell → click the
circular notification.

**Before this fix**, this showed "Access denied" and signed the student
out. Confirm it now correctly takes them to their own dashboard instead.
