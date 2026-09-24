# Student & Parent mobile shell — Testing checklist

## What this closes

Student and Parent previously had zero mobile-shell treatment — the
original single-page desktop-style dashboard, no bottom nav, nothing
from this whole Android effort applied to them. This gives both a real
bottom-nav experience: Home, Homework, Fees, Results, and More
(Announcements, plus Leave for students).

**Architecture note, in case it matters later**: unlike School Admin/
Super Admin (which use real routes — `/school/more`, `/school/
notifications`, etc.), Student and Parent's tabs are managed as internal
state within one component rather than separate URL routes. This was a
deliberate scope trade-off to avoid a larger routing restructure — it
works correctly and looks identical to the user, but the Android back
button won't step between tabs the way it does for School Admin (it'll
exit the tab area entirely). Worth knowing if that becomes a real
usability complaint later — fixable, but a separate piece of work.

## A real bug caught and fixed while building this

The Homework screen has its own back button, originally hardcoded to
browser-history navigation (correct for its normal use as a routed
page). Reused inside this new tab-based shell, that same back button
would have gone to a random previous page instead of returning to the
Student/Parent home tab. Caught it, added an optional override, and
wired it correctly in both new shells.

## 0. Apply and rebuild

```powershell
npm install
npm run android:sync
npm run android:open
```
Then Build → Build APK(s) in Android Studio.

## 1. Student

Log in as a student → confirm you land on a proper bottom-nav home
screen (not the old single-page dashboard) with attendance % and
homework count, plus quick-action tiles. Tap through Homework, Fees,
Results, and More (which includes Announcements and Leave) — confirm
each back button correctly returns to Home, not somewhere unexpected.

## 2. Parent — single child

Log in as a parent with one child linked — confirm the same shell
appears, no child-switcher shown (since there's nothing to switch
between).

## 3. Parent — multiple children

Log in as a parent with more than one child linked — confirm a
dropdown appears on Home to switch between them, and that switching
correctly reloads Fees/Results/Homework/attendance for whichever child
is selected.

## 4. Fees and Results accuracy

Compare what shows on the mobile Fees/Results screens against the same
student's data in the desktop/web app (or the parent portal) — confirm
the numbers match exactly, since both pull from the same underlying
data.

## 5. Confirm Teacher's earlier fix still holds

Log in as a teacher — confirm they still correctly land in the shared
`/school/*` mobile shell (fixed last round) and nothing regressed.
