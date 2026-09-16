# AURAED SCHOOL

Multi-tenant School ERP SaaS. See `docs/ARCHITECTURE.md` for the full design
and phase plan, and `docs/PHASE_1_TESTING.md` for how to verify this delivery.

## Quickstart

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
# apply supabase/migrations/*.sql to your Supabase project (CLI or SQL editor, in order)
npm run dev
```

## Status

Phase 9 of 22 complete:
- Phase 1: project foundation, Supabase client setup, database schema shell,
  RLS-enforced multi-tenancy, authentication, and RBAC.
- Phase 2: Super Admin Schools CRUD (list/search/create/edit/suspend), a
  generic audit-logging trigger, and a secure Edge Function for inviting
  School Admins (see `docs/DEPLOY_EDGE_FUNCTIONS.md` to deploy it).
- Phase 3: Features catalog, Plans CRUD (with feature checkboxes and
  limits), per-school Subscriptions (trial/active/suspended/cancelled, with
  computed expiring/expired states), and database-level feature gating via
  `school_has_feature()` — a suspended/expired subscription blocks feature
  access immediately without touching or deleting any school data.
- Phase 4: real School Admin dashboard with live counts; Students CRUD
  (with archive, search, detail view); Teachers CRUD; Parents CRUD with
  child-linking; Staff CRUD — all permission-gated per role, feature-gated
  per plan, RLS-scoped per school, and audit-logged automatically.
- Phase 5: Student Attendance — mark present/absent/late/leave per
  class/section/date, editable and idempotent per student per day, with a
  per-student attendance percentage and history shown on their profile.
- Phase 6: Teacher Punch In/Out with real geolocation capture, database-
  enforced geofencing (haversine distance check in a trigger, not just
  client-side), automatic working-hours calculation, duplicate-punch
  prevention, a correction-request workflow (teacher submits, admin
  approves/rejects), a Missing Punch report, and a new Edge Function
  letting School Admins give existing teacher records real login access.
- Phase 7: Academics — Academic Sessions, Classes & Sections, Subjects,
  Class/Subject Teacher assignments, and a Timetable builder with
  database-enforced conflict prevention (a teacher can't be double-booked
  across classes at the same day/period). Also normalized the free-text
  class/section fields used since Phase 4 into real linked tables, via an
  automatic one-time backfill that preserved every existing student's data.
- Phase 8: Homework, Assignments (with grading), and Study Materials — the
  first modules using real Supabase Storage (three private buckets, RLS-
  protected per school, accessed only via short-lived signed URLs). Teacher
  creation rights are checked against their actual subject_teacher
  assignments from Phase 7, not just a role check. Also fixed a real gap:
  Teachers previously had no route access to the /school/* page tree at
  all despite having relevant permissions — the sidebar now also filters
  itself by permission so each role only sees pages relevant to them.
- Phase 9: Exams, Marks, and Report Cards. Exam papers per class/section/
  subject with max/passing marks; marks entry restricted to teachers'
  actual subject assignments; a finalize/lock workflow enforced by a
  database trigger (not just a disabled button) so locked results can't be
  edited even via a direct API call; and PDF report card generation (the
  first phase using `@react-pdf/renderer`) combining marks, percentage,
  pass/fail, and real attendance data into a downloadable, signable PDF.

See `docs/ARCHITECTURE.md` §6 for the full phase checklist — we're building
this one phase at a time. See `docs/PHASE_9_TESTING.md` to verify this delivery.
