# Phase 17 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0033_messaging.sql`
   - `supabase/migrations/0034_messaging_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Announcements** and
**Messaging/Chat** checked.

## 2. School-wide announcement

Log in as School Admin → **Announcements & Messages**.

- Post one with target "Everyone" (e.g. "School closed Friday for
  maintenance").
- Confirm it appears in the list showing "Everyone".
- Log in as a teacher — confirm they can see it too.

## 3. Role-targeted announcement

- As School Admin, post one targeted at role "TEACHER" only (e.g. "Staff
  meeting Monday 9am").
- Confirm a teacher can see it.
- If you have a login for a different role (e.g. Accountant, Librarian),
  confirm **they cannot** see this one — the role filter should genuinely
  hide it, not just visually.

## 4. Class-targeted announcement

- Post one targeted at a specific class (e.g. class 9).
- Log in as a teacher **assigned to that class** (via Teacher Assignments
  from Phase 7) — confirm they can see it.
- Log in as a teacher **not** assigned to that class — confirm they
  **cannot** see it. This is the more precise test: it's not "any
  teacher", only ones actually tied to that class via class_teachers or
  subject_teachers.

## 5. Direct messaging

- Log in as School Admin, go to the **Messages** tab.
- Confirm the "Colleagues" list shows other users at your school (this
  only works because of the new profile-visibility rule added this
  phase — worth noting if it's empty, that's a real bug, not empty data).
- Pick a teacher, send a message ("Hi, can you check the announcement I
  posted?").
- Log in as that teacher, go to Messages — confirm the conversation and
  message appear correctly, with your message aligned differently from
  theirs.
- Reply from the teacher's account, confirm School Admin sees the reply
  when they check back.

## 6. Tenant isolation

- Confirm via console, logged in as School B, that `announcements` and
  `messages` queries only ever return School B's rows, and that School B
  users never appear in School A's colleague list or vice versa.

Report back what passes/fails and we'll fix anything broken before Phase 18
(Events & Calendar).
