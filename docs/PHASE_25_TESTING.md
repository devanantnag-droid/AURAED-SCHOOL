# Phase 25 — Testing checklist (Logout fix, empty states, notifications)

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the one new migration:
   - `supabase/migrations/0049_notifications.sql`
3. **Deploy the new Edge Function**:
   ```powershell
   supabase functions deploy send-email
   ```
   Real email won't send until you also set up a free Resend account —
   see `docs/DEPLOY_EDGE_FUNCTIONS.md` section 5 for the full walkthrough.
   Until then, replies still work completely normally, just without an
   actual email going out.
4. Restart `npm run dev`, hard-refresh.

## 1. The logout fix — the important one

Before this phase, Teacher, Student, and Parent accounts had **no way to
sign out** at all except clearing browser data.

- Log in as a Teacher → confirm you now see a top bar with their name and
  a **Sign out** button → click it → confirm you land back on the login
  screen.
- Do the same for a Student login and a Parent login.

## 2. Empty state polish

- Find a student with no marks recorded yet (or a fresh test student) —
  confirm the "Recent marks" section shows a friendlier message with a
  small icon, not just bare text.
- Check the same for homework, assignments, fees, and announcements
  sections if any are empty for that student.

## 3. Notification bell — basic check

- Log in as School Admin → look at the top of the sidebar → confirm you
  see a bell icon next to "AURAED SCHOOL".
- Click it → confirm a dropdown appears (likely "You're all caught up"
  if nothing's happened yet).

## 4. Trigger a notification — announcement

- As School Admin, post a new announcement targeted at **a specific
  class** that has a student with a portal login.
- Log in as that student (or their parent) → check the bell → confirm a
  red unread badge appears, and clicking it shows the new announcement
  notification.
- Click the notification → confirm it navigates you to the announcements
  page and marks itself as read (badge count drops).

## 5. Trigger a notification — homework

- As School Admin or a teacher, post new homework for a class with an
  invited student.
- Log in as that student → confirm a "New homework: ..." notification
  appears.

## 6. Trigger a notification — ticket reply (both directions)

- As School Admin, raise a new support ticket.
- As Super Admin, reply to it → log back in as School Admin → confirm a
  notification appears ("New reply on your support ticket").
- As School Admin, reply back → log in as Super Admin → confirm **they**
  now get a notification too ("New reply on a support ticket"). This
  direction didn't exist before this phase — Super Admin previously got
  no notification of anything.

## 7. Trigger a notification — grievance reply

- As a student/parent, raise a grievance.
- As School Admin, reply to it → log back in as the student/parent →
  confirm a "New reply on your grievance" notification appears.

## 8. Real email (only if you completed the Resend setup)

- Make sure the person you're replying to (the ticket's raiser, or the
  grievance's raiser) has the **same email you used to sign up for
  Resend** — this is a sandbox-tier limitation, not a bug.
- Reply to their ticket or grievance as described above.
- Check that inbox — confirm a real email arrived within a few seconds,
  in addition to the in-app notification.
- If you haven't set up Resend yet, skip this — the reply still works,
  it just won't send an email alongside it.

## 9. Mark all as read

- With a few unread notifications sitting in the bell, click **Mark all
  read** → confirm the badge disappears and all items in the list show
  as read (no more blue highlight).

## 10. Tenant isolation

- Confirm School B's notifications never leak into School A's bell, and
  vice versa — post a class-targeted announcement at School A, confirm
  no School B user ever sees a notification for it.

## Known scope decisions in this phase

- Email is wired for **ticket replies and grievance replies only** —
  the two cases where one specific person is clearly waiting for a
  response. Broad-audience emails (e.g. emailing an entire class when an
  announcement is posted) would need additional recipient-resolution
  logic and isn't built in this pass — the in-app notification already
  covers that case well.
- Real SMS delivery was intentionally not built — it requires a paid
  provider (Twilio, MSG91, etc.) with a real account and per-message
  cost. The notification system's design doesn't block adding it later;
  it would follow the same pattern as `send-email`.
