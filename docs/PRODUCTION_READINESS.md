# Production Readiness Checklist

Everything through Phase 22 has been built and tested against your local
dev setup (Vite dev server + your own Supabase project). This doc covers
what's specifically different about running this for a real school, beyond
what any of the phase docs cover.

## 1. Supabase project settings

- **Upgrade off the free tier** before real usage — the free tier pauses
  after a week of inactivity and has low connection/storage limits.
- **Auth email templates**: Supabase's default auth emails (invite,
  password reset) are sent from a shared Supabase domain and are
  rate-limited. For production, set up a custom SMTP provider under
  Authentication → Settings → SMTP Settings (e.g. Resend, Postmark,
  SendGrid) so emails reliably reach real inboxes and aren't rate-limited
  by Supabase's shared sender.
- **Connection pooling**: if you expect more than a handful of concurrent
  users, switch the app's connection string to Supabase's connection
  pooler (Session or Transaction mode) rather than the direct connection,
  under Project Settings → Database.
- **Backups**: enable Point-in-Time Recovery (Pro plan and up) or at least
  confirm daily backups are on, under Project Settings → Database →
  Backups.
- **Storage limits**: the free tier caps total Storage at 1GB. Homework
  attachments, admission documents, and school logos will accumulate —
  monitor this as real schools onboard.

## 2. Environment variables

Your `.env` currently holds:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
For a production deployment, set these as environment variables in your
hosting provider's dashboard (Vercel/Netlify/etc.) rather than committing
a `.env` file. Never expose the `service_role` key to the frontend — it's
only used server-side in the Edge Functions (see `DEPLOY_EDGE_FUNCTIONS.md`).

## 3. Hosting the frontend

This is a standard Vite + React SPA — any static host works:
- **Vercel** or **Netlify**: connect the repo, set the build command to
  `npm run build`, output directory `dist`, add the environment variables
  above. Both auto-deploy on push.
- Set up a **custom domain** once you have one, and enable HTTPS (both
  Vercel and Netlify handle this automatically via Let's Encrypt).
- Since this is a client-side-routed SPA (`react-router-dom`), make sure
  your host is configured to redirect all paths to `index.html` (Vercel
  and Netlify both do this automatically for Vite projects; if
  self-hosting behind nginx, you'll need a fallback rule).

## 4. Edge Functions

Two Edge Functions exist (`onboard-school-admin` from Phase 2,
`invite-teacher-login` from Phase 6) — see `docs/DEPLOY_EDGE_FUNCTIONS.md`
for the deploy steps. These need to be deployed to your **production**
Supabase project separately from your dev project, if they're different
projects.

## 5. Security summary — what's already enforced, and what was fixed late

Every table in this app has Row Level Security enabled, scoped by
`school_id` and, for anything beyond basic viewing, a specific permission
check — this has been true since Phase 1 and was re-verified throughout.
Two real gaps were found and fixed during the build, both now closed:

- **Phase 19**: the `teachers` table never let a teacher see their own
  record — fixed in `0039_teachers_self_view_fix.sql`.
- **Phase 20 → 21**: a bulk CSV export / cross-module dashboard feature
  was accidentally gated behind a permission code that had broader grants
  left over from Phase 1's original scaffolding — fixed in
  `0041_reports_permission_fix.sql`.
- **Phase 22**: the audit log's read policy had no permission check at
  all (only tenant-membership) — fixed in `0043_audit_log.sql`.

All three are exactly the kind of thing worth a final manual pass before
go-live: **as a very last step, walk through each non-admin role's
sidebar** (Teacher, Accountant, Librarian, Receptionist, Transport
Manager, HR Manager) and confirm nothing unexpected is visible. The
`Audit Log` page introduced in Phase 22 is a good tool for this — it
shows exactly who changed what, if anything looks off after go-live.

## 6. What's NOT built (known scope boundaries, not bugs)

- No parent or student portal login. Every parent/student-facing feature
  currently routes through staff acting on their behalf.
- No general Staff login-invite flow (only Teachers can be invited to log
  in, via Phase 6's `invite-teacher-login` function).
- No payment gateway integration — fee payments are recorded manually
  (cash/cheque/card/online/UPI/bank transfer as a label), not actually
  processed by the app.
- No SMS/WhatsApp notifications — announcements and messages are
  in-app only.
- No automated recurring-fee generation (e.g. auto-creating next month's
  tuition fee row) — fee structures are assigned manually per class.

None of these block a school from using the admin/teacher/staff side of
the system productively; they're the natural next phases if you continue
building.

## 7. Before your first real school signs up

1. Create their school record via Super Admin (Phase 2).
2. Assign them a Plan with the features they're paying for (Phase 3).
3. Send them their School Admin invite.
4. Have them work through Settings → Branding & Profile (Phase 21) to set
   their real name, logo, and contact info — this now correctly appears
   on every report card, receipt, payslip, certificate, and ID card
   (fixed after a real bug was caught during testing).
5. Point them at the relevant `docs/PHASE_N_TESTING.md` files if they want
   to self-verify anything, though those were written for you as the
   builder, not as end-user documentation — a proper user guide is a
   good next step beyond this checklist.
