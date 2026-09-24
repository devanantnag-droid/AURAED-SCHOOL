# Phase 9 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. **This phase adds a brand-new npm package** (`@react-pdf/renderer`, for
   generating report card PDFs), so run this before anything else:
   ```powershell
   npm install
   ```
   This will take a bit longer than usual since it's downloading a new
   package, not just updating your source files.
3. Run the two new migrations in order:
   - `supabase/migrations/0016_exams_marks.sql`
   - `supabase/migrations/0017_exams_marks_rls.sql`
4. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Exams** and **Results & Report
Cards** checked (Super Admin → Plans → Edit).

## 2. Create an exam and its papers

Log in as School Admin.

- Go to **Exams** → fill in name (e.g. "Unit Test 1"), pick a type, dates →
  **Create**.
- Select that exam from the dropdown.
- Under "Add exam paper", pick a class/section/subject you've already set
  up teacher assignments for (from Phase 7/8 testing), set max marks (e.g.
  100) and passing marks (e.g. 33), click **Add paper**.
- Confirm it appears under "Exam papers".
- Add a second paper for a different subject in the same class/section, if
  you have more than one subject set up.

## 3. Enter marks

- Go to **Marks**, pick the exam and the paper you just created.
- Confirm the roster loads with your active students in that class/section.
- Enter a mark for each student, click **Save** for each.
- Refresh the page, confirm the marks you entered are still there (not
  reset).

## 4. Finalize/lock results

- Still on the Marks page, click **Finalize & lock results**.
- Confirm the input fields and Save buttons become disabled/greyed out.
- Try editing a mark directly via the browser console to confirm the lock
  is real, not just a UI disable:
  ```js
  // Replace with a real mark id from the marks list you just saved
  const { error } = await window.supabase.from('marks').update({ marks_obtained: 999 }).eq('id', 'SOME_MARK_ID');
  console.log(error);
  ```
  This should fail with a message about results being finalized/locked.
- Click **Unlock results**, confirm the fields become editable again.

## 5. Generate a report card (PDF)

- Go to **Report Cards**.
- Pick the exam, class, section, and a student who has marks entered.
- Click **Generate report card** — confirm a preview summary appears
  showing the subject count found.
- Click **Download PDF** — confirm a real PDF downloads and opens, showing:
  - School name, exam name
  - Student name, admission number, class/section
  - A table with each subject's marks vs max marks and pass/fail
  - Total, percentage, and overall result
  - Attendance percentage (from Phase 5 data)
  - Signature lines at the bottom

## 6. Teacher-side test

- Log in as a teacher who has a subject assignment (from Phase 7/8
  testing) and marks.enter permission (they have it by default).
- Confirm their dashboard now has a **Marks** quick link.
- Confirm they can enter marks only for exam papers matching subjects they
  actually teach — try picking a paper for a subject/class they don't
  teach and confirm the save is rejected (same real database rejection
  pattern as Phase 8's homework/assignments).

## 7. Tenant isolation

- Confirm via console, logged in as School B, that `exams`,
  `exam_subjects`, and `marks` queries only ever return School B's rows.

Report back what passes/fails and we'll fix anything broken before Phase 10
(Fees, Payments, Receipts, Accounts).
