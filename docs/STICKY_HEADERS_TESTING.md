# Sticky Page Headers — Testing checklist

## What changed

Every School Admin and Super Admin page's title now stays pinned to the
top of the content area while the rest of the page scrolls beneath it,
instead of scrolling away. Same treatment for Teacher/Student/Parent's
dashboard header.

This was applied to **31 pages total** — 29 handled by a careful,
verified automated pass (only applied where the header was a simple
static title, never to anything with dynamic/complex content), plus 2
handled by hand (Student Detail and School Detail, since their headers
include dynamic data and action buttons like Edit/Delete).

## To apply

No migration needed — pure app code.
```powershell
npm run dev
```
(or rebuild the desktop/Android app as usual)

## To test

Pick a handful of pages with genuinely long lists — Students, Transport
(with several vehicles), Circulars, Grievances — and for each:
1. Open the page
2. Scroll down through the list
3. Confirm the title (and subtitle, where one exists) stays fixed at
   the top, with a clean background — no content visibly showing
   through or overlapping behind it
4. Confirm the title doesn't have an awkward gap or misalignment when
   stuck vs. when at the top of the page unscrolled

Also check the two hand-edited detail pages specifically, since they
have buttons in the header:
- **A student's detail page** — confirm the status badge and Edit
  button still show correctly on the right side of the sticky header
- **A school's detail page** (Super Admin) — confirm Edit and Delete
  school buttons still work correctly from the sticky header

And the portal pages:
- **Teacher, Student, and Parent dashboards** — confirm the header
  (name, notification bell, network indicator, sign out) stays fixed
  while scrolling.

## Known scope note

This covers every page reachable from the sidebar navigation. Dashboard
"home" pages (School Admin's and Super Admin's main landing screens)
were not touched, since they use a different, shorter layout that
doesn't scroll long enough for this to matter in the same way — let me
know if you'd like the same treatment there too.
