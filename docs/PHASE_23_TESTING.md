# Phase 23 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0044_tickets.sql`
   - `supabase/migrations/0045_tickets_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. No feature gate to check

Unlike most modules, Support Tickets isn't gated by plan — it's always
available to every School Admin, same as Settings, so there's nothing to
toggle in Plans first.

## 2. Raise a ticket

Log in as School Admin → **Support Tickets** in the sidebar.

- Fill in a subject (e.g. "Can we get bulk SMS for fee reminders?"),
  description, category "Feature request", priority "Medium".
- Click **Submit ticket**.
- Confirm it appears in the list with status "open".

## 3. Super Admin sees it

- Log in as Super Admin (`super@gmail.com`) → **Support Tickets** in the
  sidebar.
- Confirm the ticket appears, showing the school name and who raised it.
- Click it to expand — confirm you see the full description.

## 4. Triage from the Super Admin side

- Change the **status** dropdown to "in_progress" — confirm it saves
  (reload the page to be sure, or just watch the badge update).
- Change the **priority** dropdown to "high" — confirm it saves.
- Write a reply (e.g. "Looking into this, will update by Friday") and
  click **Send**.

## 5. School Admin sees the reply

- Log in as School Admin, go to **Support Tickets**, click the ticket.
- Confirm the status badge now shows "in progress", and the Super Admin's
  reply appears in the thread.
- Write a reply back (e.g. "Thanks, no rush") and send it.

## 6. Confirm School Admin cannot change status/priority directly

This is the important security check — School Admin can raise tickets and
reply, but triage (status/priority) is Super Admin's job only. While
logged in as School Admin, try it directly via the console:
```js
// Replace with a real ticket ID from your testing above
const { error } = await window.supabase.from('tickets').update({ status: 'closed' }).eq('id', 'YOUR_TICKET_ID');
console.log(error);
```
This should **fail** — School Admin has no update policy on the `tickets`
table at all, only Super Admin does.

## 7. Close the loop

- As Super Admin, set the ticket's status to "resolved", then "closed".
- Log in as School Admin, confirm the reply box disappears once status is
  "closed" (the UI hides it, since there's nothing more to discuss on a
  closed ticket — they'd raise a new one if needed).

## 8. Tenant isolation

- Log in as School B's admin, raise a ticket, confirm School A's admin
  never sees it in their own Support Tickets list.
- Confirm Super Admin sees tickets from **both** schools in one combined
  queue, correctly labeled with each school's name.

Report back what passes/fails, then we'll move to Phase 24 — the
Parent/Student Portal.
