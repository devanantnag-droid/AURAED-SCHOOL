# Deploying the Edge Functions

These are small server-side functions that can safely use Supabase's
service_role key (something that must never go in the frontend). There are
five of them:

- `onboard-school-admin` (Phase 2) — lets a Super Admin invite a School
  Admin by email.
- `invite-teacher-login` (Phase 6) — lets a School Admin give an existing
  teacher record a real login.
- `invite-portal-login` (Phase 24) — the same idea, generalized to give an
  existing student or parent record a real portal login.
- `send-email` (Phase 25) — sends a real email via Resend when a ticket or
  grievance gets a reply, so the person waiting doesn't have to keep
  checking the app. **Needs one extra one-time step** — see below.
- `admin-reset-password` (post-launch extension) — lets a School Admin
  reset a Teacher/Student/Parent's password directly, or Super Admin reset
  a School Admin's — replacing the old email-based "forgot password" link
  with a no-email flow, since account creation already works this way
  since the credential-based login change.
- `super-admin-delete` (Phase 30) — lets Super Admin permanently delete an
  entire school (and every account/record in it), or an individual
  teacher/student/staff/parent record at any school. The most destructive
  function in the system — every deletion is logged to audit_logs first.
- `create-super-admin` (Phase 30) — lets an existing Super Admin create
  another Super Admin account, direct email + password.

You only need to deploy each one once; after that, every future invite or
notification just works from the UI.

## 1. Install the Supabase CLI (one-time)

```powershell
npm install -g supabase
```

Verify it installed:
```powershell
supabase --version
```

## 2. Log in

```powershell
supabase login
```
This opens a browser window — approve access, then return to the terminal.

## 3. Link your project (one-time per project)

You need your **project ref**, which is the short id in your Supabase
project's URL, e.g. if your dashboard URL is
`https://supabase.com/dashboard/project/abcd1234efgh`, the ref is
`abcd1234efgh`. (It's the same value that appears before `.supabase.co` in
your `VITE_SUPABASE_URL`.)

```powershell
cd C:\Users\user\Desktop\auraed-school-phase1\auraed-school
supabase link --project-ref YOUR-PROJECT-REF
```
It'll ask for your database password (the one you set when creating the
project) — enter it.

## 4. Deploy the functions

Deploy whichever ones you haven't already:

```powershell
supabase functions deploy onboard-school-admin
supabase functions deploy invite-teacher-login
supabase functions deploy invite-portal-login
supabase functions deploy send-email
supabase functions deploy admin-reset-password
supabase functions deploy super-admin-delete
supabase functions deploy create-super-admin
```

That's it for the first three — no secrets to manually configure, because
Supabase automatically injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` into every Edge Function's environment for you.

`send-email` needs one more thing before it actually sends anything real —
see the next section.

## 5. One-time setup for real email (Resend)

`send-email` won't send anything until it has an API key for
[Resend](https://resend.com) — a modern, developer-friendly email service
with a generous free tier.

1. Go to **https://resend.com** and sign up for a free account.
2. In the Resend dashboard, go to **API Keys** → create one, copy it (it
   starts with `re_`).
3. Set it as a Supabase secret:
   ```powershell
   supabase secrets set RESEND_API_KEY=re_your_key_here
   ```
4. Redeploy the function so it picks up the secret:
   ```powershell
   supabase functions deploy send-email
   ```

**Important limitation to know about**: on Resend's free/sandbox tier,
you can only send emails **to the email address you signed up with** — not
to arbitrary recipients. To send to real students/parents/teachers, you'd
need to verify your own domain in Resend (their dashboard walks you
through adding a couple of DNS records). For testing, just make sure the
person you're replying to in the app has the same email you used to sign
up for Resend.

Until you complete this setup, replies to tickets and grievances still
work completely normally — the app just won't send a real email
alongside them. Nothing breaks either way.

## 6. Verify

- **onboard-school-admin**: open a school's detail page as Super Admin, try
  **Invite a School Admin**.
- **invite-teacher-login**: as School Admin, go to Teachers, try **Invite
  login** on a teacher without one yet.
- **invite-portal-login**: as School Admin, go to Students or Parents, try
  **Invite to portal** on a record without a login yet.
- **send-email**: reply to a ticket or grievance where the other party's
  email matches your Resend sign-up email — check that inbox for the
  email a few seconds later.
- **admin-reset-password**: as School Admin, go to Teachers/Students/
  Parents, click **Reset password** on someone who already has a login,
  set a new one, then log in as them with it.

If it works, you're done. If you get an error, check:

- Supabase Dashboard → **Edge Functions** → (the function name) → **Logs**
  tab — the actual server-side error will be there.
- Make sure you're logged into the app as a user with the right role — the
  functions reject anyone without School Admin (or Super Admin, for
  onboard-school-admin) permissions.
