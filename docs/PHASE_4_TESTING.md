# Phase 4 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order (same Notepad → copy → paste →
   Run routine as always):
   - `supabase/migrations/0006_students_staff.sql`
   - `supabase/migrations/0007_students_staff_rls.sql`
3. Restart `npm run dev`, hard-refresh the browser.

## 1. Feature gating check first

Before testing CRUD, make sure the school you're testing with actually has
`student_management`, `teacher_management`, `parent_management`, and
`staff_management` enabled on its plan — otherwise you'll correctly see an
"Upgrade Plan" message instead of the module (that's Phase 3's gate working
as intended, not a bug).

If needed, edit your "Basic" plan (or whichever plan your test school is
on) as Super Admin and check those four features, then save.

## 2. Students CRUD

Log in as a School Admin.

- Go to **Students** in the sidebar → **New student**. Fill in first/last
  name, admission number, class, section. Save.
- Confirm it lands on the student's detail page showing the info you
  entered.
- Go back to the list, confirm the new student shows up, search for them
  by name and by admission number.
- Click **Edit**, change the class, save, confirm it persisted.
- From the list, click **Archive** on a student → confirm dialog → confirm.
  Status badge should show "archived". The student should still appear in
  the list (data isn't deleted) but marked archived.

## 3. Teachers CRUD

- Go to **Teachers** → **New teacher**. Fill in name, employee ID,
  designation. Save.
- Confirm it appears in the list, edit it, confirm changes persist.
- Archive one, confirm the badge updates.

## 4. Parents CRUD + child linking

- Go to **Parents** → **New parent**. Fill in name, relationship, phone.
- In **Linked children**, check one or two of the students you created
  earlier. Save.
- Go back to the parent list — confirm "Children linked" shows the right
  count.
- Go to that student's detail page (**Students** → click the student name)
  → confirm the parent now shows up under "Linked parents/guardians".
- Edit the parent, uncheck a child, save, confirm the count drops and the
  student's detail page no longer shows that parent.

## 5. Staff CRUD

- Go to **Staff** → **New staff member**. Fill in name, employee ID, role
  title. Save.
- Edit it, archive it, confirm both work.

## 6. Dashboard counts

- Go to **Dashboard** — the Students/Teachers/Parents/Staff cards should
  show real counts matching what you just created (active records only —
  archived ones won't count).
- Click each card, confirm it navigates to the right list page.

## 7. Tenant isolation (the recurring, most important check)

- Log in as **School A's** admin, create a student there.
- Log in as **School B's** admin — confirm you do NOT see School A's
  student in your Students list.
- From the browser console (`allow pasting` if prompted), while logged in
  as School B's admin, try:
  ```js
  const { data } = await window.supabase.from('students').select('*');
  console.log('students I can see:', data);
  ```
  Every row returned must belong to School B only.

## 8. Permission check

- If you have a TEACHER test user, log in as them and go to
  `/school/students` directly in the URL bar — they should be able to
  **view** the list (Teachers were granted `students.view` back in Phase 1)
  but should **not** see "New student", "Edit", or "Archive" links, since
  they don't have `students.create/edit/delete`.
- Confirm this in the console too:
  ```js
  await window.supabase.from('students').insert({ school_id: 'their-school-id', admission_number: 'X', first_name: 'X', last_name: 'X' });
  ```
  Should fail for a Teacher, should succeed for a School Admin.

Report back what passes/fails and we'll fix anything broken before Phase 5
(Student Attendance).
