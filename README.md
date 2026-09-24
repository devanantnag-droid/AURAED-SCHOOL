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

Phase 22 of 22 (original plan) complete, plus post-launch extensions:
Phase 23 (Ticket Raise System), Phase 24 (Parent/Student Portal +
Grievance System), Phase 25 (logout fix, empty-state polish, and a
notification system), and Phase 26 (direct credential-based account
creation, replacing invite emails).
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
- Phase 10: Fees, Payments, Receipts, and Accounts. Fee categories and
  per-class fee structures, bulk-assignable to a class's students; payment
  recording with a database-generated sequential receipt number and a
  downloadable PDF receipt; a trigger that automatically keeps each
  student's amount-paid and pending/partial/paid status in sync with their
  real payment history (never set directly by the app, so it can't drift);
  and a simple Accounts page tracking expenses against real fee income.
- Phase 11: Payroll. Salary structures and payslips shared across both
  Teachers and Staff via nullable dual-FK columns; net salary always
  database-computed, never entered directly; one payslip per employee per
  month enforced by a database constraint; PDF payslip generation; and a
  teacher self-service payslip view that relies entirely on RLS (no
  explicit "my payslips only" filter in the UI code) to prove out the same
  security model used for their own punch records back in Phase 6.
- Phase 12: Library. Book catalog with available-copy tracking enforced by
  a database trigger (rejects issuing a book with zero copies left, not
  just a disabled dropdown option); issue/return records supporting both
  student and teacher borrowers via the same dual-nullable-FK pattern as
  Payroll; and the `LIBRARIAN` role (seeded since Phase 1, unused until
  now) gets its first real permissions.

- Phase 13: Transport. Vehicles (with embedded driver info), Routes,
  Stops, and per-student route/stop assignments (one active assignment per
  student, enforced by a database unique constraint). The `TRANSPORT_MANAGER`
  role (seeded since Phase 1, unused until now) gets its first real
  permissions, alongside School Admin.

- Phase 14: Inventory. Categories, items (with reorder-level low-stock
  warnings), and a transaction ledger (purchase/issue/return/adjustment)
  that automatically adjusts stock via trigger — with a database check
  constraint that makes it impossible for stock to go negative, tested
  directly, not just prevented in the UI.

- Phase 15: Admissions. The full enquiry-to-admission pipeline (enquiry →
  applied → under review → approved/rejected → admitted), interview
  scheduling, document uploads (a fourth private Storage bucket, same
  per-school-folder pattern as Phase 8), and a deliberate one-way "Admit
  as student" action that creates a real student record from the approved
  applicant's data — keeping a permanent link back to the original
  admission so the pipeline history is never lost.

- Phase 16: Certificates & ID Cards. Customizable certificate templates
  with `{{placeholder}}` substitution (bonafide, transfer, character, or
  custom wording), an auto-numbered issued-certificate audit trail (same
  sequential-number pattern as Phase 10's receipts), and PDF generation
  for both certificates and student/teacher ID cards.

- Phase 17: Announcements & Messaging. Announcements targetable at
  everyone, a specific role, or a specific class — with class-targeted
  visibility genuinely restricted to teachers actually assigned there
  (via class_teachers/subject_teachers), not just "any teacher". Direct
  messaging between any two logged-in users at a school. Also fixed a
  real gap found while building this: the existing profile-visibility
  rule from Phase 1 only let a user see their own profile or, if they
  were School Admin, everyone at their school — meaning a regular teacher
  had no way to even see a list of colleagues to message. A new policy
  now lets anyone with `messaging.use` see their colleagues' names.

- Phase 18: Events & Calendar. School events targetable the same way as
  Phase 17's announcements (everyone/role/class, with the same precise
  class-teacher check), a Going/Maybe/Can't-go RSVP per user, and a live
  RSVP headcount visible to the event's organizer.

- Phase 19: PTM Scheduling. Teacher time slots for a parent-teacher
  meeting day, booked on a parent's behalf since there's no parent portal
  login yet (front-desk/admin books by phone or walk-in, same limitation
  noted in earlier phases). One booking per slot enforced by a database
  unique constraint, with `is_booked` automatically kept in sync by a
  trigger — never set directly by the app. Also fixed a real gap found
  while testing: the `teachers` table's row-level security (dating back
  to Phase 4) never let a teacher see even their own record, which meant
  any part of the app joining in a teacher's name while they were logged
  in silently came back blank — now fixed with a policy letting a teacher
  see their own row.
- Phase 20: Reports & Export. No new tables this phase — a cross-module
  summary dashboard (active students/teachers/staff, today's attendance
  rate, this month's fee collection vs pending, low-stock alerts, upcoming
  events) and CSV export for Students, Attendance, Fee Collection, Exam
  Results, and Payroll, all built directly off data from every prior
  phase's tables. Kept restricted to School Admin only, given bulk data
  export is more sensitive than viewing one record at a time. Also fixed
  a real access-control gap found while testing: the permission code this
  phase used for gating already existed since Phase 1 with broad grants
  to Teacher/Parent/Student/Accountant for unrelated original purposes,
  which would have let colleagues bulk-export each other's payroll data;
  replaced with a distinct, correctly-scoped permission.
- Phase 21: Settings & Branding. Also no new tables — the `schools` table
  has held every branding field (name, logo, contact info, principal,
  website, description) since Phase 1, and School Admin could already
  edit their own school's profile since Phase 2's RLS policy; this phase
  just builds the missing UI and adds a public Storage bucket (the only
  public bucket in the app, since a logo is meant to be displayed, not
  access-controlled) for logo uploads. Also fixed a real bug found after
  the fact: every generated PDF (report cards, receipts, payslips,
  certificates, ID cards) had "AURAED SCHOOL" hardcoded as literal text
  instead of using each tenant school's actual name — now every document
  correctly pulls the real school name from the database. The raw
  School ID (a UUID) shown on the School Admin dashboard was also
  replaced with the school's actual name and short human-readable code.
- Phase 22 (final): Audit Log UI + a full security audit pass. Built the
  Audit Log page the original plan called for — filterable, paginated,
  with expandable before/after JSON for every tracked change — surfacing
  the `audit_logs` table that's been silently recording every insert/
  update/delete since Phase 2. Along the way, found and fixed a real gap:
  the audit log's read policy had no permission check at all, only a
  tenant-membership check, meaning any logged-in user at a school
  (not just School Admin) could already query the full audit trail
  directly, including payroll changes. Also re-audited every place a
  later phase reused a permission code seeded back in Phase 1
  (`fees.*`, `attendance.*`, `students.*`) to check for other silent
  mismatches like the `reports.view` bug found in Phase 20 — none found;
  those were all correctly, deliberately planned from the start.

See `docs/ARCHITECTURE.md` §6 for the full phase checklist, and
`docs/PRODUCTION_READINESS.md` for what's left before a real school goes
live — we built this one phase at a time. See `docs/PHASE_22_TESTING.md`
to verify that delivery.

- Phase 23: Ticket Raise System (post-launch extension, requested after
  the original 22-phase plan). School Admin can raise a support ticket or
  feature request to Super Admin, with a threaded reply conversation.
  Deliberately not feature-gated by plan, same as Settings — every school
  can always reach support. School Admin can create tickets and reply,
  but cannot change status/priority directly (no update policy on the
  `tickets` table for them at all) — triage is exclusively Super Admin's
  job, verified by attempting a direct update via the console and
  confirming it's rejected. Super Admin gets a combined queue across every
  school, filterable by status.

See `docs/PHASE_23_TESTING.md` to verify this delivery.

- Phase 24 (post-launch extension, requested after Phase 23): the
  Parent/Student Portal and a Grievance System. This is the largest single
  phase of the whole build — not a new module, but real login access for
  two roles (PARENT, STUDENT) that only ever had permission scaffolding
  since Phase 1, plus a genuinely new security model (self-view RLS)
  layered across ten-plus existing tables.
  - Added `students.user_id` (parents already had one since Phase 4, just
    never wired to a login) and three new helper functions —
    `current_student_id()`, `is_parent_of()`, `my_children()` — mirroring
    the `current_teacher_id()` pattern from Phase 6.
  - Read-only self-view RLS added across students, attendance, homework,
    assignments, study materials, marks, exam subjects, fees, payments,
    certificates, and library records — a student sees only their own
    data, a parent only their linked children's.
  - Class-targeted announcements/events (Phase 17/18) now actually reach
    students and parents in that class — previously only teachers.
  - A new `invite-portal-login` Edge Function (mirroring Phase 6's
    teacher-invite pattern) lets School Admin give an existing
    student/parent record a real login, with "Invite to portal" buttons
    added to the Students and Parents admin pages.
  - Real Student and Parent dashboards, replacing their Phase-1
    placeholders — a student's actual name now appears on login, alongside
    their attendance, fees, homework, assignments, marks, and any
    announcements/events targeted at them. A parent gets the same view for
    each linked child, with a switcher if they have more than one.
  - **Grievance System**: a parent or student can raise a complaint —
    optionally naming a specific teacher — that goes privately to School
    Admin, with threaded replies. Deliberately private by design: the
    named teacher is never given automatic visibility into a grievance
    against them, verified directly via a console query returning empty
    even for the named teacher.
  - A real bug caught and fixed before shipping: the first draft of the
    portal summary would have shown a parent with children in different
    classes a mix of both kids' homework/assignments together. Fixed by
    filtering to the specific child being viewed.

See `docs/PHASE_24_TESTING.md` to verify this delivery.

- Phase 25 (post-launch extension, requested after Phase 24): three
  improvements.
  - **A real gap fixed**: Teacher, Student, and Parent dashboards never
    had a sign-out button at all since Phase 6 — only School Admin and
    Super Admin got one, via their layout components. A shared
    `PortalTopBar` component now gives all three a proper sign-out,
    including on their loading/error states so no one is ever stuck.
  - Friendlier empty-state messaging across the student/parent portal
    (fees, homework, assignments, marks, announcements, grievances) —
    small icons and encouraging text instead of bare "No X yet." lines.
  - An in-app **Notification Center**: a new `notifications` table with
    triggers that auto-populate it when an announcement/event is posted
    (respecting the same all/role/class targeting), new homework/
    assignment is created, or a ticket/grievance gets a reply. A bell
    icon with an unread badge now appears for School Admin, Super Admin,
    and every portal role. A real gap was found and fixed while building
    this: Super Admin was never notified of anything at all (new tickets,
    or a School Admin's reply) — both directions now work.
  - **Real email delivery** via a new `send-email` Edge Function (Resend),
    wired into ticket and grievance replies — the two cases where one
    specific person is clearly waiting for a response. Deliberately not
    wired into broad-audience announcements (would need more
    recipient-resolution work) and explicitly does not include SMS,
    which needs a paid provider account the user would need to set up
    themselves.

See `docs/PHASE_25_TESTING.md` to verify this delivery.

- Phase 26 (post-launch extension, requested after Phase 25): a major
  change to how every login gets created. Previously, creating a School
  Admin, Teacher, Student, or Parent login sent an invite email and the
  person set their own password by clicking through. Now, whoever creates
  the account (Super Admin for School Admins; School Admin for Teachers/
  Students/Parents) sets the email **and** password directly in the form,
  and the account works immediately — no invite email, no separate
  set-password step. All three Edge Functions
  (`onboard-school-admin`, `invite-teacher-login`, `invite-portal-login`)
  were rewritten from Supabase's `inviteUserByEmail` to `createUser` with
  `email_confirm: true`. A new shared `CreateLoginModal` component
  (email + password + confirm password, with validation) replaced the
  single-field `window.prompt()` previously used for Teacher/Student/
  Parent logins, since a browser prompt can't reasonably collect two
  fields. Every existing permission check, RLS policy, and
  tenant-isolation rule is unchanged — only the account-creation
  mechanism itself changed. The regular login page, and Forgot Password,
  are both untouched.

See `docs/PHASE_26_TESTING.md` to verify this delivery.
