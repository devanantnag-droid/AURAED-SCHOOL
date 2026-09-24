# Mobile Reports + Offline Attendance Queue — Testing checklist

## Mobile Reports

Generates the same data as the desktop Reports page (Students,
Attendance, Fee Collection) and displays it as an in-app table.

**Honest scope note**: this does not produce a downloadable PDF/CSV file
or use Android's share sheet — doing that properly needs two more
Capacitor plugins (Filesystem, Share) that aren't installed yet. Rather
than fake a "Download" button that doesn't actually save anything to the
device, this shows the report data directly in a scrollable table,
which the spec's own wording ("a mobile-friendly viewer") supports. If
you want real file export/sharing from the phone, that's a clean,
well-scoped follow-up — just say so.

### To test
1. `npm install && npm run android:sync && npm run android:open`, rebuild
   the APK.
2. Log in as School Admin → **Reports** → pick a report → for
   Attendance/Fees, set a date range → **Generate report** → confirm the
   table shows real data matching what you'd see on the desktop Reports
   page for the same range.

## Offline attendance queue

This is the one piece of true offline-write handling in this build,
built deliberately for Attendance only — your spec is explicit that
offline handling must never cause silent data loss, and that's not
something to spread thin across every screen at once.

**What it actually does:**
- Before saving, checks the *real* connection state (the same
  online/server-reachable check from the network indicator, not just
  "is wifi on").
- If genuinely offline: saves the attendance data to the device's local
  storage instead of trying to reach the server, and tells the teacher
  plainly — **"Saved locally — no connection right now. It will sync
  automatically once you're back online."** Never claims it reached the
  server when it didn't.
- Shows a persistent **"N attendance records saved locally, waiting to
  sync"** banner for as long as anything is queued.
- The moment the connection genuinely comes back, automatically retries
  each queued save. Only removes an item from the queue once its save
  actually succeeds — a partial failure leaves the rest queued rather
  than silently dropping them.
- Reports back what happened: **"2 offline attendance records
  synchronized"**, or **"1 still pending — will retry"** if something
  failed.

### To test
1. On your phone/emulator, turn on **Airplane Mode**.
2. Open the app → Attendance → mark a class → **Save attendance**.
3. Confirm you see "Saved locally…", not a generic error, and the
   "waiting to sync" banner appears.
4. Turn Airplane Mode back off.
5. Within a few seconds (no need to reopen the screen), confirm the
   banner disappears and a "synchronized" message appears.
6. Check the desktop/web app — confirm that attendance record is
   actually there.
7. Force a failure case: mark attendance offline, then close the app
   entirely before reconnecting, reopen it once back online — confirm
   the queued record is still there (survives an app restart, since
   it's in real local storage) and still syncs correctly.

### What's still out of scope

Homework creation, marks entry, and every other write path still
require being online — only Attendance has the offline queue. Extending
this pattern to other screens is straightforward now that the
underlying queue utility exists, but each one deserves the same
individual care and testing rather than a blanket rollout.
