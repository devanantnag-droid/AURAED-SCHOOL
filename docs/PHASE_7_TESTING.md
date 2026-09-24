# Phase 7 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0012_academics.sql`
   - `supabase/migrations/0013_academics_rls.sql`

   **Important**: `0012` includes a one-time backfill that reads your
   existing students' free-text class/section (e.g. "9 - A" from Phase 4/5
   testing) and automatically creates matching `classes`/`sections` rows,
   then links each student to them. Nothing is deleted or overwritten —
   verify this worked with the query in step 1 below.
3. Restart `npm run dev`, hard-refresh.

## 1. Verify the backfill worked

Run in SQL Editor:
```sql
select c.name as class, sec.name as section, count(s.id) as student_count
from public.classes c
join public.sections sec on sec.class_id = c.id
left join public.students s on s.class_id = c.id and s.section_id = sec.id
group by c.name, sec.name
order by c.name, sec.name;
```
You should see classes like "9", "11" (from your earlier testing) with
their sections and student counts, created automatically without you doing
anything.

## 2. Academics setup

Log in as School Admin → **Academics** in the sidebar.

- **Sessions tab**: add a new session (e.g. "2026-2027" with start/end
  dates). Click **Set as current**. Confirm the badge shows "Current".
  Add a second session, confirm only one can be "Current" at a time.
- **Classes & Sections tab**: confirm your backfilled classes/sections show
  up automatically (from step 1). Add a brand new class (e.g. "12"), add a
  section to it (e.g. "A"). Confirm both appear immediately.
- **Subjects tab**: add 2-3 subjects (e.g. Mathematics/MATH,
  Science/SCI). Confirm they list correctly.

## 3. Student form now uses real dropdowns

- Go to **Students** → **New student** (or edit an existing one).
- Confirm **Class** and **Section** are now dropdowns, not free-text boxes.
- Pick a class, confirm the Section dropdown updates to only that class's
  sections.
- Save, confirm the student list still shows "Class - Section" correctly
  (this is the denormalized display cache staying in sync).

## 4. Attendance still works after the class/section refactor

- Go to **Attendance** — the class/section picker should still show your
  classes correctly (now sourced from the real tables, not guessed from
  student records).
- Mark attendance for a class, save, confirm it still works exactly like
  Phase 5.

## 5. Teacher & Subject assignments

- Go to **Assignments**.
- Assign a Class Teacher: pick class, section, teacher, click Assign.
  Confirm it shows up under "Class Teachers".
- Assign a Subject Teacher: pick class, section, subject, teacher, Assign.
  Confirm it shows under "Subject Teachers".

## 6. Timetable

- Go to **Timetable**, pick a class/section.
- Click an empty cell (e.g. Monday, Period 1) — a popup should appear.
- Pick a subject and teacher, optionally a room, click **Save**.
- Confirm the cell now shows the subject and teacher name.
- Click the same cell again, click **Remove** — confirm it clears.

## 7. Conflict prevention (important — proves the database enforces this,
not just the UI)

- Assign a teacher to Monday Period 1 for Class 9 - A.
- Now try to assign the **same teacher** to Monday Period 1 for a
  **different** class/section. This should **fail** with a message like
  "This teacher is already scheduled for another class at this day and
  period."
- Try assigning two different subjects to the same class/section/day/period
  (should just overwrite via upsert, which is correct — one thing can be
  scheduled per class-slot, editing it is expected, not a conflict).

## 8. Teacher's own timetable view

- Log in as a teacher who has timetable entries assigned to them.
- Their dashboard should now show a **"My Timetable"** section listing
  their periods across all classes.

## 9. Permission check

- Log in as a Teacher and try `/school/academics` — they should be able to
  **view** (since TEACHER got `academics.view` by default) but not see any
  "Add" buttons or forms (no `academics.manage`).

## 10. Tenant isolation

- Confirm via console, logged in as School B, that `classes`, `sections`,
  `subjects`, and `timetables` queries only ever return School B's rows.

Report back what passes/fails and we'll fix anything broken before Phase 8
(Homework/Assignments/Study Materials).
