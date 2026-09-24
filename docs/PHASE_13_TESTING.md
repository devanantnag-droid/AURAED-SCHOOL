# Phase 13 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0025_transport.sql`
   - `supabase/migrations/0026_transport_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Transport** checked.

## 2. Add a vehicle

Log in as School Admin → **Transport** → **Vehicles** tab.

- Add a vehicle: number (e.g. "JK01-1234"), type "Bus", capacity 40,
  driver name and phone.
- Confirm it lists correctly with all details shown.

## 3. Add a route with stops

- Switch to **Routes & Stops** tab.
- Add a route (e.g. "Route A"), optionally linking the vehicle you just
  created.
- Confirm it appears with the vehicle number shown.
- Add 2-3 stops to it with different stop orders (e.g. "Main Gate" #1,
  "Market" #2, "Bridge" #3).
- Confirm they display in order, each as a small pill.

## 4. Assign a student

- Switch to **Student Assignments** tab.
- Pick a student, the route you created, and one of its stops.
- Click **Assign**.
- Confirm a success message and the assignment appears in the list below.
- Try assigning the **same student** to a different route/stop — confirm
  it updates their existing assignment rather than creating a duplicate
  (check the list still shows only one row for that student).

## 5. Permission check

- If you have a Transport Manager test account, confirm they can do
  everything School Admin can here (their role was specifically granted
  `transport.manage`).
- Confirm a role without `transport.view` doesn't see Transport in their
  sidebar.

## 6. Tenant isolation

- Confirm via console, logged in as School B, that `vehicles`, `routes`,
  `stops`, and `student_transport` queries only ever return School B's
  rows.

Report back what passes/fails and we'll fix anything broken before Phase 14
(Inventory).
