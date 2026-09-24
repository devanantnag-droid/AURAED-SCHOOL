# Phase 26 — Testing checklist (Direct credential-based login creation)

This phase changes how every login gets created across the whole app —
School Admin, Teacher, Student, and Parent. Instead of sending an invite
email and waiting for the person to click a link and set their own
password, whoever creates the account now sets **both the email and
password directly**, and the account works immediately.

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. **No new SQL migration this time** — this phase only changed Edge
   Functions and frontend forms, not the database schema.
3. **Redeploy all three affected Edge Functions** (this is required —
   the old deployed versions still send invite emails until you redeploy):
   ```powershell
   supabase functions deploy onboard-school-admin
   supabase functions deploy invite-teacher-login
   supabase functions deploy invite-portal-login
   ```
4. Restart `npm run dev`, hard-refresh.

## 1. Super Admin creating a School Admin

- Log in as Super Admin → open a school's detail page.
- Confirm the section now says **"Create a School Admin"** (not "Invite a
  School Admin"), and the form now has **three** fields: full name, email,
  and password (not two).
- Fill it in with a real email and a password of your choosing (at least
  8 characters).
- Click **Create account**.
- Confirm the success message says the account works immediately — no
  mention of an email being sent.
- **Immediately log in** with that exact email and password (no invite
  email to check, no link to click) — confirm it works right away and
  lands you on that school's dashboard.

## 2. School Admin creating a Teacher login

- Log in as School Admin → **Teachers** → find a teacher without a login
  yet → click **Create login**.
- Confirm a modal pops up (not a browser prompt) asking for email,
  password, and confirm password.
- Try submitting with mismatched passwords — confirm you get a clear
  "Passwords do not match" message and nothing is created.
- Try a password under 8 characters — confirm it's rejected.
- Now fill it in correctly and submit.
- Confirm a success message, then log in immediately with those
  credentials — confirm it works and lands on the Teacher Dashboard.

## 3. School Admin creating a Student portal login

- Go to **Students** → find one without a login → click **Create portal
  login**.
- Same modal, same validation. Create one.
- Log in immediately with those credentials — confirm the Student
  Dashboard loads with their real name.

## 4. School Admin creating a Parent portal login

- Go to **Parents** → find one without a login → click **Create portal
  login**.
- Same flow. Create one, log in immediately, confirm the Parent
  Dashboard loads with their linked child's data.

## 5. Confirm no invite emails are being sent anymore

If you have access to the inbox of an email you used in any of the tests
above, confirm **no invite/set-password email arrives** — since the
account is created with a real password directly, there's nothing to
invite them to.

## 6. Tenant isolation (unchanged, but worth re-confirming)

- As School B's admin, try creating a login for a School A student by
  guessing/pasting their ID (you'd need browser dev tools for this) —
  confirm the Edge Function still rejects it, exactly as before. This
  protection lives in the same permission/ownership checks that were
  already there — this phase only changed *how* the account gets its
  password, not who's allowed to create one.

## What did NOT change

- The actual **login page** (`/login`) is exactly the same — email and
  password, then routed to the right dashboard by role. This phase only
  changed how accounts get *created*, not how people *log in* — that part
  already worked this way.
- **Forgot Password** still works via Supabase's normal reset-email flow
  (untouched by this phase).
- Every permission check, RLS policy, and tenant-isolation rule from every
  prior phase is unchanged — only the account-creation mechanism itself
  was rewritten.
