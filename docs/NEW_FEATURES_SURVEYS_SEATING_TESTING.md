# New features — Testing checklist (Parent Surveys + Exam Seating)

## A real bug caught before shipping

While building the survey notification trigger, I nearly reused the
existing shared "notify targeted users" helper for the class-targeting
case — but that helper's class mode notifies teachers and students in
the class too, not just parents. Wrong for a parent-only survey, so I
wrote a separate, narrower notification insert instead. Also caught and
fixed one wrong import (`Exam` type pulled from the wrong file) using
the same systematic export-checking approach as previous rounds.

## 0. Apply

```powershell
supabase link --project-ref gezywcwwzcxvpitkwnjv   # if needed
```
Apply migrations `0055_parent_surveys.sql` and `0056_exam_seating.sql`
in the Supabase SQL Editor, in that order, then:
```powershell
npm run supabase:types
npm install
npm run dev
```

## 1. Parent Feedback Surveys

**As School Admin**: go to **Parent Surveys** in the sidebar → create a
survey with a mix of rating and text questions, targeted either at all
parents or one specific class → confirm it saves and appears in the
list below, expanded by default.

**As a Parent** whose child matches the targeting: open your child's
portal → a new **Surveys** tab should appear → confirm the survey shows
up, submit a response → confirm it shows "your response has been
recorded" and doesn't let you submit twice.

**Back as School Admin**: reopen the survey — confirm the response you
just submitted appears in the aggregated results (average rating, or
the text answer listed).

**Targeting check**: create a class-targeted survey, and confirm a
parent whose child is in a *different* class does NOT see it at all.

## 2. Exam Seating

**As School Admin**: go to **Exam Seating** → add a couple of rooms with
different capacities → pick an existing exam (one that already has exam
subjects/papers set up for at least two different classes) → select
your rooms → **Generate seating**.

Confirm:
- The chart shows every student assigned a room and seat number
- Scanning down the seat numbers within one room, adjacent seats are
  from different classes (this is the actual point of the feature —
  worth actually checking, not just skimming)
- If you deliberately pick rooms with less total capacity than the
  number of students, confirm you get a clear "X couldn't be seated"
  message rather than a silent failure or a crash

**As a Student/Parent**: once seating is generated, this is visible to
them via RLS (their own seat only) — a dedicated UI to *show* it to
them isn't built yet in this pass; right now only School Admin has a
page to view the chart. Worth flagging if you want that added next.

## Honest scope notes

- Live bus GPS tracking (the third feature requested) hasn't been
  started — it needs a new driver role and continuous location
  reporting, which is a meaningfully bigger undertaking than these two.
- Student/Parent don't yet have their own UI to see an exam seat
  assignment, even though the data access (RLS) already supports it.
