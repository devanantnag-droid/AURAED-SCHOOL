# Phase 24 — Testing checklist (Parent/Student Portal + Grievance System)

This is the biggest phase of the whole build — it doesn't just add a
module, it opens up real login access for two roles that only ever had
scaffolding before. Take this one slowly.

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the three new migrations **in order**:
   - `supabase/migrations/0046_portal_foundation.sql`
   - `supabase/migrations/0047_announcements_events_student_view.sql`
   - `supabase/migrations/0048_grievances.sql`
3. **Deploy the new Edge Function** (this is required — the portal invite
   button won't work without it):
   ```powershell
   supabase functions deploy invite-portal-login
   ```
   See `docs/DEPLOY_EDGE_FUNCTIONS.md` if you need the full walkthrough.
4. Restart `npm run dev`, hard-refresh.

## 1. Invite a student to the portal

Log in as School Admin → **Students** → find a student (e.g. "Ayat
Bhat") → click **Invite to portal** → enter an email you can access (a
second Gmail address works fine for testing, like you've done for other
roles).

- Confirm a success message appears.
- Check that email inbox for the invite, click through, set a password.
- Log in as that student.

## 2. The student's own dashboard

- Confirm the page shows the student's **real name** as the heading, not
  a generic "Welcome" message with nothing personal.
- Confirm their class/section shows underneath.
- Confirm you see: attendance percentage, their fee lines (view only — no
  "record payment" button, since students can't pay through the app),
  homework, assignments, recent marks, and any announcements/events
  targeted at them.

## 3. Invite a parent to the portal

- Log in as School Admin → **Parents** → find a parent already linked to
  a child (check Phase 4's parent-child linking if you need to set one
  up) → click **Invite to portal** → enter an email.
- Log in as that parent.
- Confirm you see the same dashboard content, but for their child.
- If that parent has **more than one child** linked, confirm a dropdown
  appears to switch between them, and confirm switching actually changes
  the data shown (not just the child's name).

## 4. The "different classes" bug fix — verify it directly

If you can set up a parent with two children in **different classes**
(or simulate it via SQL), confirm that switching between children in the
dashboard shows **only that child's own** homework/assignments — not a
mix of both children's. This was a real bug I caught and fixed before
shipping.

## 5. Announcements/events reaching students and parents

- As School Admin, post an announcement targeted at a **specific class**
  that includes the student you invited.
- Log in as that student (or their parent) — confirm it now appears in
  their dashboard feed. Before this phase, class-targeted announcements
  only ever reached teachers, never students/parents.

## 6. Grievance System — raising one

- Still logged in as the student or parent, switch to the **Grievances**
  tab on their dashboard.
- Raise one: category "Teacher conduct", pick a teacher, write a
  description.
- Confirm it appears in their own list with status "open".

## 7. School Admin sees it

- Log in as School Admin → **Grievances** in the sidebar.
- Confirm the grievance appears, showing the student's name and the named
  teacher.
- Reply to it, change its status to "under_review".

## 8. The privacy rule — verify it directly

This is the most important security check in this phase. If you have a
login for the **teacher named in the grievance**, log in as them and
confirm they have **no way to see it anywhere** — no Grievances page in
their sidebar at all, and if you know the grievance's ID, try this in
their browser console:
```js
const { data, error } = await window.supabase.from('grievances').select('*').limit(5);
console.log(data, error);
```
This should return an **empty array**, not the grievance — even though
it's about them.

## 9. Student/parent sees the reply

- Log back in as the student/parent, check the grievance — confirm the
  School Admin's reply appears, and the status shows "under review".

## 10. Self-view security spot-checks

While logged in as the student:
```js
// Try to see another student's fee data — replace with a real other
// student's id from your test data.
const { data, error } = await window.supabase.from('student_fees').select('*').eq('student_id', 'SOME_OTHER_STUDENT_ID');
console.log(data, error);
```
Should return an empty array — RLS should silently filter it out, proving
a student can only ever see their own data, never a classmate's.

## 11. Tenant isolation

Confirm all of the above holds separately and correctly for School B —
a School B parent/student should never see School A's announcements,
grievances, or data, and vice versa.

## Known limitation carried into this phase

Fee **payment** is still staff-recorded only — a parent/student can view
their fee status but there's no payment gateway for them to actually pay
through the portal. That's a natural next phase if you want to keep
extending this.
