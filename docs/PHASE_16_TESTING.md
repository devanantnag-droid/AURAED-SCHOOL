# Phase 16 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations in order:
   - `supabase/migrations/0031_certificates.sql`
   - `supabase/migrations/0032_certificates_rls.sql`
3. Restart `npm run dev`, hard-refresh.

## 1. Feature gate check

Make sure your test school's plan has **Certificates** and **ID Cards**
checked. (These are separate features — worth testing what happens if only
one is checked, since the two tabs are gated independently.)

## 2. Create a certificate template

Log in as School Admin → **Certificates & ID Cards** → **Certificates**
tab.

- Pick type "Bonafide Certificate" — confirm the body text box auto-fills
  with a default template using `{{placeholders}}`.
- Give it a name (e.g. "Standard Bonafide"), click **Save template**.
- Confirm it appears in the small list under the form.

## 3. Issue a certificate

- Under "Issue certificate", pick a student and the template you just
  created.
- Confirm a preview appears below with the placeholders **actually
  replaced** — student's real name, admission number, class, session, and
  today's date, not the literal `{{...}}` text.
- Click **Issue certificate**.
- Confirm a success block appears showing a certificate number
  (`CERT-000001` or similar).
- Click **Download PDF** — confirm a real PDF downloads showing the school
  name, certificate title, certificate number, the filled-in body text,
  date, and a signature line for "Principal".
- Confirm it now appears in "Issued certificates" below.

## 4. Generate an ID card

- Switch to the **ID Cards** tab.
- Pick "Student", select one, click **Download ID Card** — confirm a
  small card-sized PDF downloads with the school name, student name,
  "Student — [class]", and their admission number.
- Switch to "Teacher", select one, download — confirm it shows "Teacher"
  and their employee ID instead.

## 5. Permission check

- If you have a Receptionist test account, confirm they can do everything
  School Admin can here (their role was specifically granted
  `certificates.manage`).
- Confirm a role without `certificates.view` doesn't see this page in
  their sidebar.

## 6. Tenant isolation

- Confirm via console, logged in as School B, that
  `certificate_templates` and `issued_certificates` queries only ever
  return School B's rows.

Report back what passes/fails and we'll fix anything broken before Phase 17
(Messaging & Announcements).
