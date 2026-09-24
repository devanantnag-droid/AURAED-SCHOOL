# Phase 27 — Testing checklist (Leave System)

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the new migration:
   - `supabase/migrations/0050_leave_system.sql`
3. **Regenerate your types** (this is now the correct workflow going
   forward, since you have a real generated types file):
   ```powershell
   npm run supabase:types
   ```
4. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Log in as Super Admin → Plans → edit your test plan → make sure **Leave
System** is checked → Save.

## 2. Teacher raises a leave request

Log in as a teacher → scroll to the **Leave** section on their dashboard
→ pick a type, dates, reason → **Submit request** → confirm it appears
below with status "pending".

## 3. Student raises a leave request

Log in as a student → **Leave** tab → same flow → confirm it works
identically.

## 4. School Admin approves/rejects

Log in as School Admin → **Leave Management** in the sidebar.

- Confirm both requests appear (filtered to "Pending" by default).
- Add an optional note, click **Approve** on one, **Reject** on the other.
- Confirm they disappear from "Pending" and show correctly under
  "Approved"/"Rejected".

## 5. Notification fires

Log back in as the teacher/student whose request you just decided —
confirm a notification appears ("Your leave request was approved/
rejected"), including your note if you added one.

## 6. Security check

While logged in as a teacher, try approving your own request directly:
```js
const { error } = await window.supabase.from('leave_requests').update({ status: 'approved' }).eq('status', 'pending');
console.log(error);
```
This should not actually change anything — only School Admin has update
rights on this table.

## 7. Tenant isolation

Confirm School B's leave requests never appear in School A's Leave
Management page, and vice versa.
