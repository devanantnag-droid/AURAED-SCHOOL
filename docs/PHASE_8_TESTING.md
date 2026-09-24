# Phase 8 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0014_homework_assignments_materials.sql`
   - `supabase/migrations/0015_homework_assignments_materials_rls.sql`

   **Note**: `0015` also creates three Storage buckets (`homework`,
   `assignments`, `study-materials`) via SQL — you don't need to create
   these manually in the Supabase dashboard, the migration does it.
3. Restart `npm run dev`, hard-refresh.

## 1. Verify the storage buckets were created

In the Supabase dashboard, go to **Storage** in the left sidebar. Confirm
you see three new buckets: `homework`, `assignments`, `study-materials` —
all marked private (not public).

## 2. Feature gate check

Make sure your test school's plan has **Homework**, **Assignments**, and
**Study Materials** checked (Super Admin → Plans → Edit).

## 3. An important prerequisite: subject-teacher assignment

Since Phase 7, creating homework/assignments/materials as a teacher
requires you to actually be assigned to teach that class+section+subject
(via the Assignments page). If you haven't already:

- Go to **Assignments** (the Teacher Assignments page) → **Assign Subject
  Teacher** → pick a class, section, subject, and a teacher → Assign.

School Admins bypass this check entirely and can create content for any
class/subject.

## 4. Homework

- Log in as School Admin (or the teacher you just assigned).
- Go to **Homework** in the sidebar.
- Fill in class/section/subject (and teacher, if you're School Admin —
  teachers get themselves auto-selected and don't see that dropdown).
- Enter a title, optionally a description and due date.
- Attach a small file (any PDF/image/doc under a few MB).
- Click **Assign homework**.
- Confirm it appears in the list below with an "Attachment" link.
- Click the **Attachment** link — confirm it opens/downloads the actual
  file you uploaded.
- Click **Delete** on it, confirm it disappears from the list.

## 5. Assignments + grading

- Go to **Assignments** (the new "Assignments" nav item, not "Teacher
  Assignments").
- Create one with a due date and max marks, attach a file, save.
- Confirm the attachment downloads correctly.
- Click **Grade** on the assignment — confirm it expands to show every
  active student in that class/section (pulled from the real roster, not
  requiring them to have "submitted" anything first, since there's no
  student login yet).
- Enter marks and feedback for one student, click **Save**. Confirm their
  status badge flips to "graded".

## 6. Study Materials

- Go to **Study Materials**, upload one with a file attached.
- Confirm it lists correctly and the download link works.
- Delete it, confirm it's removed.

## 7. Teacher's own view

- Log in as a teacher (one linked to a login from Phase 6, and ideally
  assigned to teach something via Assignments in step 3).
- Confirm their dashboard now shows quick links: Mark Attendance, Homework,
  Assignments, Study Materials.
- Click into Homework — confirm they can create homework **only** for
  classes/subjects they're actually assigned to teach. Try picking a
  different subject they don't teach and confirm it's rejected (a real
  database-level rejection, not just a UI restriction) — the exact error
  will come from Postgres via the same error-handling fix from Phase 6.

## 8. Permission check

- If you have a Parent or Student test account (none exist yet with real
  logins, since we haven't built that portal), skip this — otherwise
  confirm they can view but not create.
- Confirm an Accountant or Receptionist test user does NOT see Homework/
  Assignments/Study Materials in their sidebar at all (since they weren't
  granted those permissions).

## 9. Tenant isolation

- Confirm via console, logged in as School B, that `homework`,
  `assignments`, and `study_materials` queries only ever return School B's
  rows — and that trying to download a School A file by guessing its path
  fails.

Report back what passes/fails and we'll fix anything broken before Phase 9
(Exams/Results/Report Cards).
