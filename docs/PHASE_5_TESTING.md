# Phase 5 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0008_student_attendance.sql`
   - `supabase/migrations/0009_student_attendance_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Attendance** checked (Super Admin →
Plans → Edit → check "Attendance" → Save), or you'll correctly see an
"Upgrade Plan" screen instead of the Attendance page.

## 2. Mark attendance

Log in as a School Admin (or a Teacher, once you have one set up).

- Go to **Attendance** in the sidebar.
- You should see a Class/Section dropdown — it's built from whatever
  classes your students actually have (e.g. "9 - A", "11 - A" from Phase 4
  testing). Pick one.
- Today's date should be pre-filled. Every student defaults to "Present".
- Click a different status (Absent/Late/Leave) on one or two students to
  make sure the buttons are interactive and visually update.
- Try the "Mark all present" and "Mark all absent" quick actions — confirm
  every student's buttons update at once.
- Click **Save attendance**. Confirm the success message shows the right
  count and date.

## 3. Confirm it persisted correctly

Run in SQL Editor:
```sql
select s.first_name, s.last_name, sa.attendance_date, sa.status
from public.student_attendance sa
join public.students s on s.id = sa.student_id
order by sa.created_at desc;
```
Confirm the statuses match what you set for each student.

## 4. Re-open the same date — should show what you saved, not defaults

- Go back to **Attendance**, pick the same class/section and the same date
  again.
- Confirm each student now shows the status you actually saved last time
  (not reset back to "Present" for everyone) — this proves the page loads
  existing records rather than just defaulting blindly.

## 5. Try a different date

- Change the date to yesterday, mark a different pattern of
  present/absent, save.
- Confirm today's date still shows today's data if you switch back — the
  two days shouldn't overwrite each other (there's a unique constraint on
  student + date in the database).

## 6. Student profile integration

- Go to **Students** → click into a student you just marked attendance for.
- Confirm the new **Attendance** section shows a running percentage and
  lists their recent records with color-coded status badges.

## 7. Permission check

- If you have a TEACHER test user (granted `attendance.create`/`edit` by
  default from Phase 1's seed), log in as them and confirm they can mark
  attendance.
- If you have a role without `attendance.create` (e.g. an Accountant),
  confirm they can still see the Attendance page (if they have
  `attendance.view`) but the **Save attendance** button doesn't appear.

## 8. Tenant isolation

- While logged in as School B's admin, open the console and try:
  ```js
  const { data } = await window.supabase.from('student_attendance').select('*');
  console.log('attendance I can see:', data);
  ```
  Every row's `school_id` must match School B — nothing from School A or
  any other school should appear.

Report back what passes/fails and we'll fix anything broken before Phase 6
(Teacher Punch In/Out + geofencing + correction requests).
