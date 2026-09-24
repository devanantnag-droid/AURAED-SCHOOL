# Live Bus Tracking — Testing checklist

## What this actually is, honestly

A real, working foundation: a genuine driver login, a driver screen that
shares live location every 15 seconds while active, and a parent-facing
viewer showing last-known position with a one-tap link to open it in
Google Maps. What this is **not**: an embedded, auto-updating map inside
the app itself. Building that properly needs a mapping library I can't
test tile-loading for in this environment — a broken embedded map would
be worse than an honest, always-working deep link to Maps. If you want
the embedded version later, that's a clean, well-scoped next step once
this foundation is confirmed working.

## A few things worth knowing about the design

- Only ONE row per vehicle is stored (the latest position), not a
  growing history log — "where is the bus right now" doesn't need a
  history table, and this avoids unbounded row growth from frequent
  updates.
- Security is enforced by who can *write* a location, not just who can
  read it: only the vehicle's own assigned driver (`driver_user_id`)
  can update its position — nobody can spoof another vehicle's location,
  even by guessing IDs.
- A parent sees a bus's location only if their child is actually on a
  route that vehicle serves. This required tracing the real relationship
  (student → route → vehicle, not a direct link) before writing the
  security rule — worth knowing in case routes/vehicles get restructured
  later, since this policy depends on that exact chain.

## 0. Apply

Run migration `0056` (if not already applied) then `0057_live_bus_tracking.sql`
in the Supabase SQL Editor, in order. Then:

```powershell
supabase functions deploy invite-driver-login
npm run supabase:types
npm install
npm run dev
```

The edge function deploy step is required — without it, "Create driver
login" will fail with a function-not-found error.

## 1. Create a driver login

As School Admin: **Transport** → find a vehicle → **Create driver
login** → fill in name, email, password → confirm success message and
that it now shows "Driver login active" instead of the form.

## 2. Driver sharing

Log in as that driver (a fresh browser/incognito, or the phone) →
confirm you land on a simple screen showing the vehicle number → tap
**Start sharing** → confirm the "last updated" time keeps refreshing
every ~15 seconds.

**Location failure test**: deny location permission (or turn off
device location) before starting — confirm you get a clear message,
not a silent failure.

## 3. Parent viewing

As a parent whose child is assigned to a route served by that vehicle:
open your child's portal → **Bus Location** section → confirm it shows
the vehicle number, a recent "last updated X min ago", and an "Open in
Maps" button that actually opens the correct live position.

**Before the driver starts sharing**: confirm it says "hasn't started
sharing location yet today" rather than an error or a blank state.

**Isolation check**: as a parent whose child is NOT on that vehicle's
route, confirm you don't see that bus at all (RLS should block it
entirely, not just hide the button).

## Honest scope notes

- No embedded live map — see above.
- No location history — only ever the latest position.
- Driver's own past routes/mileage/timesheets aren't tracked — this is
  purely "where is the vehicle right now."
