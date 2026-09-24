# Geofencing / location fix — what was actually wrong, and how to test it

## The real cause

Geofencing itself was never broken — it's enforced entirely on the
server (a Postgres trigger doing real distance math), which can't be
bypassed by any client. The problem was upstream: **getting a location
in the first place.**

Raw browser geolocation (`navigator.geolocation`) works automatically in
a normal browser tab, but neither Electron nor a Capacitor Android app
grant that permission automatically — each has its own native permission
model that has to be explicitly wired up. Without it, the location
request was silently failing, coordinates came back empty, and the
server correctly (if confusingly) rejected the punch for "missing
location" — which looked like geofencing malfunctioning, but was really
location capture failing before geofencing ever got involved.

## What was fixed

- **Android**: added the official Capacitor Geolocation plugin, which
  handles Android's actual runtime permission prompt properly — raw
  browser geolocation doesn't reliably work inside a packaged Android
  WebView at all.
- **Desktop (Electron)**: added an explicit permission handler — Electron
  denies all permission requests (geolocation included) by default
  unless the app explicitly allows them, which nothing in this project
  did until now.
- Replaced three separate, duplicated location-fetching functions
  (Punch In/Out on both the old teacher dashboard and the new mobile
  screen, plus the "use my current location" button in School Settings'
  geofence setup) with one shared, platform-aware helper, so this can't
  drift out of sync between them again.

## To apply it

This adds a new dependency, so:
```powershell
npm install
npm run android:sync
npm run android:open
```
Rebuild the APK the same way as always. For the desktop app:
```powershell
npm run electron:build
```

## Testing

### Android
1. Install the new APK.
2. Log in as a teacher → **Punch In/Out** → tap **Punch In**.
3. The **first time**, Android should show a real permission prompt
   ("Allow AURAED SCHOOL to access this device's location?") — accept it.
4. Confirm the punch succeeds and a location gets recorded (check via
   the desktop/web app's Teacher Attendance report, or Supabase's Table
   Editor on `teacher_punch_records`).
5. If geofencing is enabled for the test school and you're genuinely
   outside the allowed radius, confirm you now see the real distance
   error message, not a generic failure.

### Desktop (.exe)
1. Rebuild and reinstall.
2. Log in as a teacher (or as School Admin, for the "use my current
   location" button in Settings → geofence setup).
3. The first time either is used, Windows may show its own OS-level
   location permission prompt (separate from the app) — allow it if so.
4. Confirm the same punch/location behavior as above.

### Regression check
Confirm the plain web/browser version still works exactly as before —
this fix only changes behavior inside the Android app and the Electron
app; the browser path was already fine and is untouched.
