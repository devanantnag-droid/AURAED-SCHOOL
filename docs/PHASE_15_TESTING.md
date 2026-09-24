# Phase 15 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0029_admissions.sql`
   - `supabase/migrations/0030_admissions_rls.sql`

   **Note**: `0029` also creates a new private Storage bucket called
   `admissions` via SQL — you don't need to create it manually.
3. Restart `npm run dev`, hard-refresh.

## 1. Verify the storage bucket

Supabase dashboard → **Storage** → confirm you see an `admissions` bucket,
marked private.

## 2. Feature gate check

Make sure your test school's plan has **Admissions** checked.

## 3. Add an applicant

Log in as School Admin → **Admissions**.

- Fill in first/last name, date of birth, parent name/phone, and pick a
  class they're applying for.
- Click **Add applicant**.
- Confirm they appear in the list with status "enquiry".

## 4. Move through the pipeline

- Click **Details** on the applicant.
- Under "Move to", click **applied**, then **under review**, then
  **approved** (one at a time — confirm the status badge updates each
  time, and the available "Move to" buttons update to exclude whatever
  the current status is).

## 5. Schedule an interview

- While status is not yet "admitted", use "Schedule interview" — pick a
  date, add a note, click **Save**.
- Confirm "Currently scheduled: ..." appears with what you entered.

## 6. Upload a document

- Choose a small file, click **Upload**.
- Confirm it appears in the Documents list.
- Click it — confirm it opens/downloads correctly (same signed-URL pattern
  as Phase 8's homework attachments).

## 7. Admit the applicant

- With status "approved", click **Admit as student**.
- Confirm a success message names the applicant.
- Confirm the status badge changes to "admitted" and the pipeline/
  interview/admit controls are replaced with a simple "Admitted —
  converted to a student record" message.

## 8. Verify the real student record

- Go to **Students** — confirm a new student now exists with the
  applicant's name, date of birth, and class, with an auto-generated
  admission number starting with "ADM-".
- Run in SQL Editor to confirm the link back to the admission is intact:
  ```sql
  select a.applicant_first_name, a.applicant_last_name, a.status, s.first_name, s.admission_number
  from public.admissions a
  join public.students s on s.id = a.converted_student_id
  where a.status = 'admitted';
  ```

## 9. Permission check

- If you have a Receptionist test account, confirm they can do everything
  School Admin can here (their role was specifically granted
  `admissions.manage`).
- Confirm a role without `admissions.view` doesn't see Admissions in their
  sidebar.

## 10. Tenant isolation

- Confirm via console, logged in as School B, that `admissions` and
  `admission_documents` queries only ever return School B's rows, and that
  a document from School A's admissions can't be downloaded by guessing
  its path.

Report back what passes/fails and we'll fix anything broken before Phase 16
(Certificates & ID Cards).
