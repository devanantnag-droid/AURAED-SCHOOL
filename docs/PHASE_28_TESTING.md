# Phase 28 — Testing checklist (Circulars)

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the new migration:
   - `supabase/migrations/0051_circulars.sql`
3. `npm run supabase:types`
4. Restart `npm run dev`, hard-refresh.

## 1. Issue a circular (School Admin)

Log in as School Admin → **Circulars** → fill in title/body, pick a
target (Everyone / a role / a class), optionally attach a PDF → **Issue
circular** → confirm it appears with an auto-generated number (CIR-000001).

## 2. Attachment download

If you attached a file, confirm the **Attachment** link opens it in a new
tab.

## 3. Reaches the right people

- Post one targeted at **a specific class** with a student invited there.
- Log in as that student (or their parent) → confirm it shows up under
  "Circulars, Announcements & Events" on their dashboard.
- Confirm a notification appears too.

## 4. Teacher/staff visibility

Log in as a teacher → **Circulars** in their own sidebar (staff roles use
the same `/school/circulars` page) → confirm they can see it but have no
"Issue a circular" form (view-only).

## 5. Delete

As School Admin, delete a circular — confirm it disappears from every
view.

## 6. Tenant isolation

Confirm School B's circulars never appear for School A.
