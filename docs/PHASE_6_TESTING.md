# Phase 6 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0010_teacher_punch.sql`
   - `supabase/migrations/0011_teacher_punch_rls.sql`
3. Deploy the new Edge Function (same routine as `onboard-school-admin` from
   Phase 2 — you already have the CLI set up):
   ```powershell
   supabase functions deploy invite-teacher-login
   ```
4. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Teacher Punch In/Out** checked
(Super Admin → Plans → Edit).

## 2. Give a teacher a real login

Teachers need an actual account to punch themselves in — a teacher record
alone isn't enough.

- Log in as School Admin → **Teachers**.
- Next to a teacher without a login yet, click **Invite login**, enter an
  email you can check, confirm.
- Check that email's inbox for the Supabase invite, set a password.
- Confirm in the database:
  ```sql
  select full_name, user_id from public.teachers where user_id is not null;
  ```
  Should show the teacher now linked to a real `user_id`.

## 3. Punch In / Punch Out

- Log in as that teacher.
- You should land on a real dashboard with a big **Punch In** button (not
  the old placeholder text).
- Click **Punch In** — your browser will likely ask for location
  permission; allow it (or deny it — punching still works if geofencing is
  off, per spec).
- Confirm the "Punch In" time fills in and the button changes to **Punch
  Out**.
- Click **Punch Out** — confirm the time fills in and "Working Hours" shows
  something like "0h 1m" (however long you waited between clicks).
- Refresh the page — confirm today's punch state persists (doesn't reset).

## 4. Duplicate prevention

- Try clicking anywhere that could re-trigger a Punch In for today (there
  shouldn't be a way to in the UI once you've completed a day, but test via
  console too):
  ```js
  const { data: teacherId } = await window.supabase.rpc('current_teacher_id');
  const { error } = await window.supabase.from('teacher_punch_records').insert({
    school_id: 'YOUR_SCHOOL_ID', teacher_id: teacherId, punch_date: new Date().toISOString().slice(0,10), punch_in: new Date().toISOString()
  });
  console.log(error);
  ```
  Should fail — either the unique constraint (already has a row for today)
  or (if somehow no row existed) still succeed once, but a second attempt
  must fail.

## 5. Admin punch report

- Log in as School Admin → **Teacher Attendance**.
- Confirm the "Daily punches" tab shows the teacher's punch for today with
  correct times and working hours.
- Confirm any teacher who hasn't punched shows up under "Missing punch".

## 6. Correction requests

- Log in as the teacher again. Click "Missed a punch or made a mistake?".
- Fill in a requested punch in/out and a reason, submit.
- Confirm the success message appears.
- Log in as School Admin → **Teacher Attendance** → **Correction requests**
  tab. Confirm the request shows up as "pending" with the reason.
- Click **Approve**. Confirm it flips to "approved".
- Check the underlying punch record actually updated:
  ```sql
  select * from public.teacher_punch_records where teacher_id = 'THAT_TEACHER_ID' order by punch_date desc limit 3;
  ```
- Submit a second request, this time click **Reject**, type a reason,
  confirm — verify it shows "rejected" with your reason displayed.

## 7. Geofencing (optional but worth testing once)

- Log in as School Admin → **Settings**.
- Check **Enable geofencing**, click "Use my current location", set radius
  to something small like 50 meters, save.
- Log in as the teacher (ideally from the same physical location/browser)
  and try to Punch In — should succeed since you're within range.
- To test the rejection path: temporarily set the radius to something tiny
  like 1 meter and try punching in again on a new day (or manually via the
  console with a slightly different lat/lng) — it should fail with a clear
  "You are X meters outside the allowed area" message.
- Turn geofencing back off afterward so it doesn't block your future
  testing.

## 8. Tenant isolation

- While logged in as a School B teacher, confirm via console that
  `teacher_punch_records` queries only ever return School B's own rows.

Report back what passes/fails and we'll fix anything broken before Phase 7
(Academics: sessions/classes/sections/subjects/timetable).
