# Phase 30 — Testing checklist (Super Admin account & data powers)

**Read this whole file before testing anything here.** Every action in
this phase is permanent and cannot be undone. Test on your DEMO schools
only — never on a real school with real data you care about.

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. No new migration this time — this phase is entirely Edge Functions +
   frontend, since deletion works through the existing schema's foreign
   keys rather than needing new tables.
3. Deploy the two new functions:
   ```powershell
   supabase functions deploy super-admin-delete
   supabase functions deploy create-super-admin
   ```
4. `npm run supabase:types` (no new tables, but harmless to re-run)
5. Restart `npm run dev`, hard-refresh.

## 1. Change your own password

Log in as Super Admin → **Account & Data** → **Change my password** →
set a new one → log out → log back in with the new password to confirm
it actually took effect.

## 2. Create another Super Admin

Same page → **Create another Super Admin** → fill in name/email/password
→ **Create account** → log in as that new account in a different browser
(or incognito window) → confirm they land on the Super Admin dashboard
with full access.

## 3. Permanently delete a single record — the safer test first

**Use a throwaway test student you don't mind losing**, not your main
demo data.

Same page → **Permanent record deletion** → pick a school → **Students**
tab → pick a test student → **Delete** → type `DELETE` exactly →
**Permanently delete**.

Confirm:
- The student disappears from the list immediately
- If they had a portal login, trying to sign in with those credentials
  now fails
- Their attendance/marks/fee records (if any) are gone too — check the
  relevant lists in School Admin

## 4. Delete an entire school — the big one

**This is genuinely destructive — every account and every record at that
school is gone permanently.** Only do this against a school you've
created specifically for this test, not DEMO-1 or DEMO-2 unless you're
fully done needing them.

Super Admin → **Schools** → pick the test school → **Delete school** →
type the school's exact code shown in the confirmation box →
**Permanently delete**.

Confirm:
- You're redirected back to the Schools list, and the school is gone
- Every login tied to that school (School Admin, teachers, students,
  parents) now fails to sign in
- The school no longer appears anywhere in Super Admin

## 5. Security check

While logged in as a School Admin (not Super Admin), try calling the
delete function directly:
```js
const { data, error } = await window.supabase.functions.invoke('super-admin-delete', {
  body: { entityType: 'school', id: 'any-school-id-here', confirmText: 'x', expectedConfirmText: 'x' },
});
console.log(data, error);
```
This should come back with `success: false` — only Super Admin can use
this function.

## 6. Audit trail

As Super Admin, check the audit log entries (via Supabase's SQL Editor,
`select * from audit_logs where action like 'super_admin_delete%' order
by created_at desc`) — confirm every deletion you just tested left a
record behind, even though the deleted row itself is gone.

## A known limitation worth knowing

Deleting a school or a person removes their database records and login,
but does **not** clean up files they may have uploaded to Storage
(homework attachments, admission documents, circular PDFs, etc.). Those
files become orphaned rather than actively broken — nothing depends on
them anymore, they just aren't automatically cleaned up. Worth knowing
if storage usage ever becomes a concern; a separate cleanup pass could
be built later if it matters.
