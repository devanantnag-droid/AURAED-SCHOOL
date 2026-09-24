# Phase 1 — Testing checklist

Run these on your machine (or in Claude Code, which has real network access).

## 0. Setup

```bash
npm install
npm run typecheck   # should exit 0
```

Create a Supabase project at supabase.com if you don't have one, then:

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
```

Apply the schema — either via the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

or by pasting `supabase/migrations/0001_initial_schema.sql` then
`supabase/migrations/0002_rls_policies.sql` into the Supabase SQL editor, in
that order.

## 1. Auth smoke test

```bash
npm run dev
```

- Visit `/login` — the page renders, empty submit shows validation errors,
  a wrong password shows the real Supabase error message (not a fake one).
- In the Supabase dashboard (Authentication → Users), manually create two
  users: `admin.a@test.dev` and `admin.b@test.dev` with any password ≥ 8
  chars. Confirm each row automatically got a matching `public.profiles`
  row (the `handle_new_user` trigger) — check Table Editor → profiles.

## 2. Tenant isolation test (the mandatory one from the spec)

1. Run `supabase/seed.sql` in the SQL editor (dev/staging project only).
2. Fill in the two real UUIDs from step 1 into the commented block at the
   bottom of `seed.sql` and run those statements too — this assigns
   `admin.a@test.dev` as `SCHOOL_ADMIN` of School A, and `admin.b@test.dev`
   as `SCHOOL_ADMIN` of School B.
3. Log in as `admin.a@test.dev` in the app. Confirm you land on
   `/school/dashboard` and it shows School A's `school_id`.
4. In the Supabase SQL editor, run as the anon/authenticated role
   impersonating admin.a (Supabase dashboard's "Impersonate user" feature
   under Authentication, or via `supabase-js` in the browser console while
   logged in as admin.a):
   ```sql
   select * from schools;      -- must return ONLY School A
   select * from profiles;     -- must return ONLY School A profiles + own row
   select * from user_roles;   -- must return ONLY School A assignments
   ```
5. Repeat as admin.b — must see only School B's rows.
6. Confirm neither admin can see the other school's `school_settings`.
7. Confirm neither can insert a `user_roles` row with the *other* school's
   `school_id` (the write policy should reject it).

If any of the above leaks data across schools, that's a blocking bug — stop
and report it before moving to Phase 2.

## 3. RBAC test

- Create a third user, assign them the `TEACHER` role for School A via
  `user_roles`. Log in — should land on `/teacher/dashboard`, and hitting
  `/super-admin` or `/school/dashboard` directly in the URL bar should
  redirect to `/unauthorized`.
- Confirm `usePermission('fees.create')` returns `false` for that teacher
  (Teachers aren't granted `fees.create` in the Phase 1 seed) and `true` for
  a `SCHOOL_ADMIN` or `ACCOUNTANT`.

## 4. Negative tests

- A user with **no** role assignment at all: should reach `/unauthorized`
  after login (via `resolveHomeRoute` returning that route), not crash.
- A `profiles.status = 'inactive'` user: `ProtectedRoute` should redirect to
  `/unauthorized` even with a valid session.
- Try (from the browser console while logged in) `supabase.from('audit_logs').delete()...`
  — should fail; there's no delete policy for anyone but the table owner.

Report back which of these pass/fail and I'll fix anything broken before we
start Phase 2 (school onboarding + Super Admin schools CRUD).
