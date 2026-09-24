# Phase A — Testing checklist (Mobile-first Android shell)

## What this phase is, and isn't

This phase replaces the *shell* — navigation, the home screen, and how
you get to every module — with a real mobile-first design (bottom nav,
icon grid, cards) instead of the desktop sidebar, specifically when
running inside the actual Android app.

**It does not yet redesign individual module screens.** Tapping
"Students" from the new mobile Home or More screen still opens the same
Students page you already have (already responsive-fixed from earlier,
but not yet rebuilt mobile-first with cards instead of tables). That's
genuinely Phase B/C work, not skipped by accident.

**The web and desktop apps are completely unaffected.** This only
activates inside the real Android app — everything you're used to in
Chrome or the Windows app looks and works exactly as before.

## 0. Apply and rebuild

1. Extract this zip over your project folder.
2. No new migration, no `supabase:types` needed.
3. Sync and rebuild the Android app:
   ```powershell
   npm run android:sync
   npm run android:open
   ```
   Then Build → Build APK(s) in Android Studio, same as always.
4. Install the new APK on your phone (or emulator).

## 1. School Admin / staff home screen

Log in as School Admin on the Android app. Confirm:
- A compact header with your logo and the school's name
- A greeting ("Good morning/afternoon/evening, [name]")
- Four summary cards: Students, Teachers, Present today, Fees pending
- An icon grid of 8 quick actions below that
- A bottom nav bar: Home, Reports, Alerts, Messages, More, Sign out

## 2. The "More" screen

Tap **More** — confirm every module is there, organized into Academics,
People, Communication, Finance, Services, and Reports & Settings. Log in
as a role with limited permissions (a teacher, or a librarian) and
confirm only the modules they actually have access to appear — this
reuses the exact same permission checks as the desktop sidebar, so it
should match exactly.

## 3. Notifications tab

Tap **Alerts** — confirm a full-screen notification list appears (not
just a dropdown), with unread ones visually distinct, and tapping one
marks it read. Trigger a real notification (e.g. issue a circular from
another account) and confirm it shows up here.

## 4. Super Admin

Log in as Super Admin — confirm the same shell pattern: a smaller home
screen (Total/Active schools + 5 quick actions), and a simpler flat
"More" screen with the same 5 items.

## 5. Confirm the web/desktop apps are untouched

Open the same app in a regular browser, or the Windows desktop app —
confirm you still see the full sidebar exactly as before. This phase
should have changed nothing there.

## A note on link accuracy

While building the "More" screen, I cross-checked every single route and
permission code against the actual registered routes rather than trust
memory, and caught eleven real mistakes before they shipped (wrong paths
like a mixed-up pair between "Assignments" and "Teacher Assignments",
and a few wrong permission codes). Still worth spot-checking a handful of
tiles yourself in case anything was missed.
