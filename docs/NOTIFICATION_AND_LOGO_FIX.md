# Notification panel fix + login logo

## 1. Notification panel — the actual bug

Your two screenshots showed the same root problem in two different
places: the notification dropdown is a fixed 320px-wide panel, and on a
narrow browser window it was getting clipped — its left portion pushed
off-screen — regardless of whether it opened from the School Admin
sidebar or the Teacher portal header.

**The fix**: on narrow screens, the panel is now pinned to the screen's
own edges (a few pixels of margin on each side) near the top of the
viewport, independent of exactly where the bell button sits — so it can
never be clipped by running out of room on one side. On wider screens,
it reverts to the original anchored-dropdown behavior, opening from the
correct side for each context (leftward in the narrow sidebar, rightward
in the wider portal header).

**To test**: narrow your browser window (or use dev tools' device
toolbar for a phone width) and open the bell as School Admin, Super
Admin, and a Teacher — confirm every word is fully visible in all three,
at both narrow and normal window widths.

## 2. Your logo on the login page

Your `logo.png` is now compressed (1MB → ~150KB, still sharp at typical
display sizes) and shown next to the "AURAED SCHOOL" wordmark on the
login page — both in the desktop brand panel and the mobile fallback
header.

**To test**: open the login page at both a wide and a narrow window width
and confirm the logo appears correctly in each layout.

## Apply it

No migration, no new dependencies — pure frontend. Extract the zip,
restart `npm run dev`, hard-refresh.
