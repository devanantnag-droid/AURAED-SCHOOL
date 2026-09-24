# Phase 2 — Testing checklist

## 0. Apply what's new

1. Copy the updated files over your existing project (see the file list in
   chat — same folders as before, just overwrite).
2. Run the new migration in the Supabase SQL editor:
   `supabase/migrations/0003_schools_audit.sql`
3. Restart `npm run dev` if it's running, hard-refresh the browser.

## 1. Schools CRUD (works immediately, no extra deploy needed)

Log in as your Super Admin (or promote your existing test admin to
SUPER_ADMIN temporarily — see note below if you don't have one yet).

- Go to `/super-admin/schools` — you should see School A and School B from
  Phase 1 testing.
- Click **New school**, fill in name/code/email, submit. Confirm it appears
  in the list and a matching `school_settings` row was created (Table Editor).
- Click into a school → **Edit** → change something → save → confirm it
  persisted.
- Click **Suspend** on a school → confirm dialog appears → confirm →
  status badge flips to "Suspended". Click **Reactivate** → flips back.
- Check `audit_logs` table — you should now see rows with
  `entity_type = 'schools'` and `action` = insert/update for everything you
  just did. This is Phase 2's audit trigger working.
- Search box: type part of a school name or code, confirm the list filters.

### If you don't have a SUPER_ADMIN test user yet
Run in SQL editor (replace the UID with a real user's, e.g. your own):
```sql
insert into public.user_roles (user_id, role_id, school_id)
select '<YOUR_USER_UID>', id, null from public.roles where name = 'SUPER_ADMIN';
```
Note `school_id` is `null` here — that's required for SUPER_ADMIN (enforced
by the Phase 1 trigger).

## 2. School Admin invite (needs the Edge Function deployed)

This part won't work until `onboard-school-admin` is deployed. If you get an
error like "Failed to send a request to the Edge Function" or similar when
you try to invite an admin, that's expected until you deploy it — see
`docs/DEPLOY_EDGE_FUNCTIONS.md`.

Once deployed:
- Go to a school's detail page → **Invite a School Admin** → enter a name +
  a real email you can check → **Send invite**.
- Confirm you see the success message.
- Check the invited email inbox for a Supabase invite link; it lets them set
  a password.
- Check `profiles` for the new user: `school_id` should already be set and
  `status = 'active'` (Phase 2's Edge Function did this immediately, not
  waiting for the user to accept the invite).
- Check `user_roles`: a SCHOOL_ADMIN row for that user + school should exist.
- Check `audit_logs`: an `invite_school_admin` action row should exist.
- Try inviting the same email to a **different** school and confirm the
  Edge Function's re-check of SUPER_ADMIN still passes (it should — you're
  still Super Admin) and a real second school gets the same admin, or
  reasonably fails if Supabase Auth already has that email (expected: emails
  are globally unique in Supabase Auth, so re-inviting the same email will
  return an error — that's correct behavior, not a bug).

## 3. Negative tests

- Log in as a non-Super-Admin (e.g. one of your SCHOOL_ADMIN test users) and
  try navigating directly to `/super-admin/schools` — should redirect to
  `/unauthorized`.
- While logged in as School A's admin, open the browser console and try:
  ```js
  await window.supabase.from('schools').insert({ name: 'Hacked', code: 'HACK-1', email: 'x@x.com' });
  ```
  This should fail — School Admins don't have INSERT rights on `schools`
  (only Super Admin does, per the `schools_all_super_admin` RLS policy).

Report back what passes/fails and we'll fix anything broken before Phase 3
(Plans, Features, Subscriptions, feature gating).
