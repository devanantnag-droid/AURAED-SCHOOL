# AURAED SCHOOL — Architecture & Implementation Plan

## 0. Environment note
This project was scaffolded in a sandboxed environment with no package-registry
or database network access. Every file here is real, production-intent code —
nothing is a mock. To turn it into a running app you (or Claude Code locally)
need to:

1. `npm install`
2. Create a Supabase project (or use an existing one)
3. `supabase link --project-ref <ref>` then `supabase db push` (or run the
   SQL files in `supabase/migrations/` manually in the SQL editor, in order)
4. Copy `.env.example` to `.env` and fill in your project URL + anon key
5. `npm run dev`

Each phase from here on ships as a diff you can apply in your own repo/Claude
Code session, so testing (typecheck, lint, RLS checks against your real DB)
happens where network exists.

## 1. Tech decisions locked in for Phase 1

| Concern | Decision | Why |
|---|---|---|
| Build tool | Vite + React + TS (strict) | fast, standard, no framework lock-in |
| Styling | Tailwind CSS | matches spec, fast iteration |
| Routing | react-router-dom v6 | nested layouts + role-guarded routes |
| Server state | @tanstack/react-query | caching, works cleanly with Supabase |
| Icons | lucide-react | per spec |
| Charts (later phase) | recharts | good default, tree-shakeable |
| PDF (later phase) | @react-pdf/renderer | works well for report cards/ID cards/certs |
| Excel/CSV (later phase) | xlsx (SheetJS) + papaparse | import + export |
| DB/Auth/Storage/Realtime | Supabase | per spec |

## 2. Multi-tenant model

Single Postgres database, shared schema, **row-level isolation via `school_id`**
plus Postgres RLS (not application-layer filtering as the source of truth —
app-layer filtering is a UX nicety only, never the security boundary).

Two identity layers:

- `auth.users` (Supabase-managed) — email/password, session, etc.
- `public.profiles` (1:1 with `auth.users.id`) — carries `school_id` (nullable
  only for `SUPER_ADMIN`), `full_name`, `status` (active/inactive), `avatar_url`.

Role is **not** stored on the JWT as a trusted claim by default; it's resolved
server-side via `user_roles` and checked inside RLS policies through a
`SECURITY DEFINER` helper function (`auth.user_has_role`, `auth.user_school_id`)
so a compromised/edited client claim can't escalate privilege. This is safer
than trusting `raw_user_meta_data` for authorization decisions.

### Tenant boundary rule
Every table that holds school-specific data has a non-null `school_id uuid
references schools(id)`. Every RLS policy on such a table includes:
`school_id = auth.user_school_id()` (or a join-through equivalent for child
tables like `marks` → `exam_subjects` → `exams`), **and** `SUPER_ADMIN` gets a
separate `USING (auth.user_has_role('SUPER_ADMIN'))` OR-branch for
platform-wide read access where the spec calls for it.

## 3. RBAC model

Tables (all created in Phase 1):

- `roles` — static-ish catalog: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, PARENT,
  STUDENT, ACCOUNTANT, LIBRARIAN, RECEPTIONIST, TRANSPORT_MANAGER, HR_MANAGER
- `permissions` — fine-grained catalog, e.g. `students.view`, `fees.create`
- `role_permissions` — default permission set per role (editable later by
  Super Admin without a code deploy)
- `user_roles` — a user can hold more than one role (e.g., a Teacher who is
  also a Class Teacher / Accountant at a small school), always scoped by
  `school_id` (nullable for the platform-level SUPER_ADMIN role)

Permission checks are never hard-coded per component. A single
`usePermission('students.create')` hook (client) and a single
`auth.user_has_permission(text)` SQL function (server/RLS) are the only two
places permission logic lives. New permissions/roles are data, not code.

## 4. Auth architecture

- Supabase Auth (email/password) for all human users, including students —
  spec requires student login, so students get real `auth.users` rows too
  (created by School Admin/Admissions flow, not self-registration).
- `profiles` row is created automatically via a `handle_new_user()` trigger
  on `auth.users` insert, defaulting to `status = 'pending'` until a role +
  school assignment is completed by whoever provisioned the account.
- Session handled entirely by `supabase-js` (refresh tokens, persistence);
  React only reads `onAuthStateChange`.
- `AuthContext` exposes `{ user, profile, roles, permissions, loading }` and
  is the single source of truth the router and UI use to decide what to show.
- `ProtectedRoute` = "must be logged in". `RoleGuard` = "must have role X /
  permission Y", used to wrap Super Admin / School Admin / Teacher / Parent /
  Student route subtrees.
- Route → role landing map lives in one config file
  (`src/config/roleRoutes.ts`) so redirect-after-login logic isn't duplicated.

## 5. Database schema — Phase 1 subset

Phase 1 ships only the tables needed for auth + tenancy + RBAC + school
shell, so later phases (students, fees, attendance, etc.) attach cleanly to
a tested foundation instead of everything landing in one migration:

- `schools`
- `school_settings` (1:1 with schools — geofence, theme, working hours, etc.
  columns added incrementally as modules need them; Phase 1 adds the shape)
- `profiles`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `audit_logs` (created now because every later phase writes to it)

All other tables listed in the master spec (`students`, `subscriptions`,
`fees`, ...) arrive with the phase that owns them, per the phase plan below,
so each migration is reviewable and testable on its own.

## 6. Full phase plan (unchanged from spec, restated as the working checklist)

1. **Project foundation, Supabase config, schema shell, auth, RBAC, tenancy** ← this delivery
2. School onboarding + Super Admin schools CRUD
3. Plans, features, subscriptions, feature gating
4. School Admin dashboard shell + Students/Parents/Teachers/Staff CRUD
5. Student attendance
6. Teacher Punch In/Out + geofencing + correction requests
7. Academics: sessions/classes/sections/subjects/timetable
8. Homework/Assignments/Study materials
9. Exams/Marks/Results/Report cards (PDF)
10. Fees/Payments/Receipts/Accounts
11. Payroll
12. Library
13. Transport
14. Inventory
15. Admissions
16. Announcements + Notifications (Realtime)
17. Messaging/Chat (Realtime)
18. Events/Calendar/PTM
19. Certificates/ID cards (PDF)
20. Reports (per-role) + advanced report builder + import/export
21. Analytics dashboards (real data)
22. Audit log UI + final security/performance pass

We'll do these strictly one at a time, as you asked — I won't jump ahead.

## 7. What "done" means for Phase 1

- `npm run build` and `npm run typecheck` succeed with zero errors (verify on
  your machine/Claude Code, since I can't run npm here).
- Migrations `0001` and `0002` apply cleanly to a fresh Supabase project.
- A user created in Supabase Auth, then assigned `SCHOOL_ADMIN` for a school
  via `user_roles`, can log in and land on `/school/dashboard` (placeholder
  page for now — populated in Phase 4).
- A user assigned `SUPER_ADMIN` lands on `/super-admin` (placeholder).
- A School A admin querying `profiles`/`schools` cannot see School B's rows
  (test in the Supabase SQL editor using `set role authenticated; set
  request.jwt.claims...` or via two real test logins — instructions in
  `docs/PHASE_1_TESTING.md`).
