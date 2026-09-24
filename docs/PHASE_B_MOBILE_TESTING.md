# Phase B — Testing checklist (Attendance, Homework, Messages + network indicator)

## What's in this phase

- **Network/connectivity indicator** (Phase D, built alongside this since
  it's fully self-contained): a real online/offline/server-unreachable
  indicator in every mobile screen's header.
- **Attendance** — teachers get a genuine mobile marking screen: pick a
  class, pick a date, tap Present/Absent/Late/Leave per student, "Mark
  all present" shortcut, Save.
- **Homework** — a card-based list (subject, title, due date, teacher,
  attachment download) for anyone who can see homework.
- **Messages** — a real conversation list that opens into a chat view,
  send/receive, matching the spec's messaging pattern.

## 0. Apply and rebuild

```powershell
npm install
npm run android:sync
npm run android:open
```
Then Build → Build APK(s) in Android Studio.

## 1. Network indicator

Tap the icon in any mobile screen's header — confirm it shows connection
type and server status. Turn on airplane mode — confirm it flips to
Offline within a few seconds. Turn it back on — confirm it recovers and
shows Online again without restarting the app.

## 2. Attendance

Log in as a teacher → tap **Attendance** from Home or More → pick a
class/section → confirm the roster loads with today's existing marks (if
any) pre-filled → change a few statuses → **Save attendance** → confirm
success message. Reopen the same class/date — confirm your marks
persisted. Switch to the desktop/web app and confirm the same attendance
records show up there too (same backend, same table).

## 3. Homework

Tap **Homework** as a teacher, student, or parent — confirm existing
homework shows as cards with subject/title/due date, and any attachment
opens correctly.

**Known scope limit**: this phase is homework *viewing*, not creation —
posting new homework from the phone isn't built yet, since it needs
several more lookups (academic session, teacher's assigned subjects) to
do properly. Worth flagging as a good candidate for Phase C.

## 4. Messages

Tap **Messages** — confirm your contact list loads, tapping someone
opens a real chat view, and sending a message actually saves (check it
appears for the other person too, from their own login).

## 5. Confirm web/desktop still work exactly as before

Open the same modules in a browser or the Windows app — confirm nothing
changed there. Every one of these mobile screens only activates inside
the real Android app.
