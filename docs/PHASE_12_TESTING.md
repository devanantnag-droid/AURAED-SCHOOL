# Phase 12 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0023_library.sql`
   - `supabase/migrations/0024_library_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Library** checked.

## 2. Add a book

Log in as School Admin → **Library** → **Books** tab.

- Add a book: title, author, ISBN, category, and 2 copies.
- Confirm it lists with "2 / 2 available".
- Search by title, author, or ISBN — confirm filtering works.

## 3. Issue a book

- Switch to **Issue & Return** tab.
- Pick the book, borrower type "Student", pick one of your students, set a
  due date, click **Issue book**.
- Confirm a success message appears, and back on the Books tab the count
  now shows "1 / 2 available".
- Issue the same book to a second student (or a teacher) — confirm "0 / 2
  available" and the book now shows "(none available)" and is disabled in
  the issue dropdown.
- Try issuing it to a third person anyway via the browser console to
  confirm the database itself blocks it, not just the UI:
  ```js
  // Replace BOOK_ID and STUDENT_ID with real ones
  const { error } = await window.supabase.from('book_issues').insert({
    school_id: 'YOUR_SCHOOL_ID', book_id: 'BOOK_ID', student_id: 'STUDENT_ID', due_date: '2026-12-01'
  });
  console.log(error);
  ```
  Should fail with "No copies of this book are currently available".

## 4. Return a book

- Go back to **Issue & Return**, find one of the active issues, optionally
  enter a fine (e.g. 10), click **Return**.
- Confirm it moves from "Currently issued" to "History" with the return
  date and fine shown.
- Confirm the book's available count goes back up by 1.

## 5. Teacher self-service

- Log in as a teacher, click **Library** on their dashboard.
- Confirm they can view the catalog and issue history (teachers have
  `library.view` by default), but do NOT see "Add book" or "Issue a book"
  forms (those need `library.manage`, which teachers don't have).

## 6. Permission check

- If you have a Librarian test account, confirm they can do everything
  School Admin can on this page (their role was specifically granted
  `library.manage`).
- Confirm a role without `library.view` (if you have one) doesn't see
  Library in their sidebar at all.

## 7. Tenant isolation

- Confirm via console, logged in as School B, that `books` and
  `book_issues` queries only ever return School B's rows.

Report back what passes/fails and we'll fix anything broken before Phase 13
(Transport).
