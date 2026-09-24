# Phase C, part 1 — Testing checklist (Homework creation + Timetable)

## What's new

- **Homework creation** — teachers can now post homework directly from
  the phone: pick from their own class/subject assignments (pulled from
  their actual teaching assignments, not a generic list), title,
  description, due date. No attachment upload in this pass — kept the
  mobile form simple; attaching a file from the phone is a reasonable
  next addition if you want it.
- **Timetable** — day-tabbed view for teachers (Mon–Sat, plus Sunday),
  showing period, subject, class/section, and time for whichever day is
  selected.

## A real mistake caught before shipping

While wiring homework creation, I checked the permission code against
the actual migration rather than trust memory — I'd initially written
`homework.manage`, which doesn't exist; the real one is `homework.create`.
Fixed before it shipped. I also found and removed one unused import that
would have failed the build outright (this project has strict
unused-import checking turned on), and ran a full scan across every file
touched in this and the last two phases to make sure nothing else was
hiding the same issue.

## 0. Apply and rebuild

```powershell
npm install
npm run android:sync
npm run android:open
```
Then Build → Build APK(s) in Android Studio.

## 1. Post homework

Log in as a teacher with at least one class/subject assignment → tap
**Homework** → confirm the "Post homework" card appears with your actual
assigned classes in the dropdown (not every class in the school) →
fill it in → **Post homework** → confirm it appears in the list below
immediately.

Log in as a teacher with *no* assignments — confirm the card shows "You
have no class/subject assignments yet" rather than a broken empty
dropdown.

## 2. Timetable

Log in as a teacher → tap **Timetable** → confirm it opens on today's
day by default, and tapping other day tabs shows the right periods for
each.

## Honest status — what's still not built

Fees, Results, a dedicated Announcements feed, and Reports for mobile
are still outstanding from the original Phase C scope, along with
Phase E (offline queueing). Continuing into those next.
