# Phase 22 — Testing checklist (final phase)

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the one new migration:
   - `supabase/migrations/0043_audit_log.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Verify the access tightening

This migration fixes a real gap: the audit log's security rule previously
only checked that you belonged to the school — with no permission check at
all, **any** logged-in user (a teacher, librarian, anyone) could already
query the raw audit trail directly, including things like payroll changes.
Let's confirm that's now closed.

Log in as a **teacher** (not School Admin), open the browser console:
```js
const { data, error } = await window.supabase.from('audit_logs').select('*').limit(5);
console.log(data, error);
```
Before this fix, this would have returned real rows. Now it should return
an **empty array** with no error (RLS silently filters out everything,
which is the correct behavior — not an error, just zero rows since none
match their permission).

## 2. Feature check — new permission seeded

Run in SQL Editor:
```sql
select r.name, p.code from public.role_permissions rp
join public.roles r on r.id = rp.role_id
join public.permissions p on p.id = rp.permission_id
where p.code = 'audit.view';
```
Confirm exactly one row: **SCHOOL_ADMIN**.

## 3. The Audit Log page

Log in as School Admin → **Audit Log** in the sidebar.

- Confirm you see a list of recent changes — action (INSERT/UPDATE/DELETE),
  entity type, who did it, and when. Given how much you've tested across
  21 phases, there should be plenty of history here.
- Click on a row to expand it — confirm you see the "Before"/"After" JSON
  data for that change (for an UPDATE, both should be present; for an
  INSERT, only "After"; for a DELETE, only "Before").
- Try the entity-type filter (e.g. type "student") and click **Apply** —
  confirm the list narrows to matching rows.
- Try a date range — confirm it filters correctly.
- If you have more than 25 audit entries (likely, given your testing
  history), try **Next**/**Previous** — confirm pagination works.

## 4. Non-admin confirmation

Log in as a teacher, confirm **Audit Log** does not appear in their
sidebar at all, and that navigating directly to `/school/audit-log` shows
the "You don't have permission" message instead of the page.

## 5. Tenant isolation

Confirm via console, logged in as School B, that the audit log only ever
shows School B's own history — never School A's.

---

## This phase's other work: a full security audit, not just this one page

Before building the Audit Log page, I went back through every place a
later phase reused a permission code that had already been seeded back in
Phase 1 (`fees.*`, `attendance.*`, `students.*`, `reports.*`,
`announcements.*`) to check for other silent mismatches like the
`reports.view` bug found last phase. Only `reports.view` was actually
wrong — `fees.*`/`attendance.*`/`students.*` were all correctly,
deliberately planned from the start and later phases correctly relied on
them. No further permission-reuse bugs were found.

Nothing else to test for that — it's a negative result (confirming absence
of a bug), not something with a UI to click through.

## Known platform limitations (by design, not bugs)

These have been noted throughout the build and are worth having in one
place:

- **No parent or student portal login yet.** Every "parent" or "student"
  facing feature (PTM booking, fee visibility, report cards) is currently
  handled by staff on their behalf. The permission scaffolding for
  PARENT/STUDENT roles exists and is ready for when a portal is built.
- **No staff (non-teaching) login-invite flow.** Teachers can be invited
  to log in (Phase 6); general Staff records currently cannot, so
  Staff-specific self-service views don't exist yet.
- **Driver info is a text field on the vehicle**, not a separate Drivers
  entity — fine for one driver per vehicle, would need a small schema
  change to support multi-driver rotation.

Congratulations — with this, all 22 phases of AURAED SCHOOL are built and
(pending this final round) tested. See `docs/PRODUCTION_READINESS.md` for
what's left before a real school goes live on this.
