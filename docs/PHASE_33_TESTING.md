# Phase 33 — Testing checklist (Teacher leave visibility, announcement un-send)

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the new migration:
   - `supabase/migrations/0054_platform_announcement_cascade_delete.sql`
3. `npm run supabase:types`
4. Restart `npm run dev`, hard-refresh (a real hard refresh — Ctrl+Shift+R
   — since this fix specifically depends on picking up updated files).

## 1. Teacher can now see Leave clearly

Log in as a teacher — confirm you now see, right near the top of the
dashboard (not buried at the bottom):
- **"Student leave requests to review"** (only appears if this teacher is
  a class in-charge with pending requests — otherwise it correctly shows
  nothing at all, that's not a bug)
- A **"Leave"** section with their own request form and history — this
  one should always be visible for every teacher

If you still don't see the "Leave" section after this, that confirms the
files genuinely didn't update — check you extracted this exact zip over
the right folder.

## 2. Platform announcement delete now reaches everyone

1. As Super Admin, send a platform announcement to "Everyone, every
   school".
2. Log in as a teacher (or student, or School Admin) at any school —
   confirm the notification bell shows it.
3. Back as Super Admin, **delete** that announcement.
4. Log back in as that same teacher/student — confirm the notification is
   now **gone from their bell entirely**, not just still sitting there.

This is the real fix: before, deleting only removed it from Super
Admin's own compose list — the notification itself stayed in everyone's
bell forever, since nothing linked the two together. Now deleting the
announcement genuinely un-sends it everywhere.
