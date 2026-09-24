# Phase 31 — Testing checklist (Dashboard health graphics)

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. This adds a new dependency (`recharts`) — run:
   ```powershell
   npm install
   ```
3. No new migration, no `supabase:types` needed — these charts read from
   tables that already exist.
4. Restart `npm run dev`, hard-refresh.

## 1. School Admin Dashboard

Log in as School Admin → scroll to the bottom of the Dashboard → confirm
two new charts:
- **Attendance — last 14 days**: a line chart of daily attendance %.
  Mark attendance for today in a class, refresh, and confirm today's
  point moves.
- **Fees collected — last 6 months**: a bar chart by month. Record a fee
  payment, refresh, confirm this month's bar grows.

If there's no attendance or payment history yet, both should show "Not
enough data yet" rather than a broken or empty-looking chart.

## 2. Super Admin Dashboard

Log in as Super Admin → confirm three charts appear:
- **New schools — last 6 months**
- **Subscriptions by status** (active/trial/expired/cancelled, whatever
  you currently have)
- **Support tickets — last 14 days**

Create a new school, refresh — confirm the school-growth chart reflects
it. Open a support ticket, refresh — confirm the ticket chart reflects
it.

## 3. Tenant isolation

Confirm School A's attendance/fee charts never show School B's numbers,
and vice versa — the School Admin charts are scoped to their own school
only. The Super Admin charts are correctly platform-wide by design.

## 4. Look and feel

Confirm the charts use the same navy/brass palette as the rest of the
app, not a default recharts look — this was intentional, not left to
chance.
