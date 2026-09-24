# Phase 21 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the one new migration:
   - `supabase/migrations/0042_branding.sql`

   **Note**: like Phase 20, this adds no new tables — the `schools` table
   has had every branding field (name, logo, contact info, principal,
   website, description) since Phase 1, and School Admin could already
   edit their own school's profile since Phase 2's RLS policy. This
   migration only adds a public Storage bucket to actually upload a logo
   file into.
3. Restart `npm run dev`, hard-refresh.

## 1. Verify the storage bucket

Supabase dashboard → **Storage** → confirm you see a `branding` bucket,
and — unlike every other bucket in this app — it should be marked
**public**, not private. That's intentional this time (a logo needs to be
displayed, not access-controlled).

## 2. Edit the school profile

Log in as School Admin → **Settings** → you should land on **Branding &
Profile**.

- Confirm the form is pre-filled with your school's current name, email,
  etc.
- Change something small (e.g. the description, or add a principal name).
- Click **Save profile**.
- Confirm a success message, then refresh the page — confirm your change
  persisted.

## 3. Upload a logo

- Choose a small image file for the logo upload.
- Confirm it uploads and immediately shows a preview next to the file
  picker.
- Refresh the page — confirm the logo still shows (proving it's really
  saved to the school's `logo_url`, not just a local preview).

## 4. Verify the logo is genuinely public

- Copy the logo's URL (right-click the image → copy image address, or
  check the network tab).
- Open that URL in a private/incognito browser window, logged out
  entirely.
- Confirm the image loads with no login required — this confirms the
  bucket is correctly public, unlike every other file-storage bucket in
  the app which requires a signed URL.

## 5. Non-admin view

- Log in as a teacher, go to **Settings** → **Branding & Profile**.
- Confirm they see a simple read-only view (school name, logo, email) —
  not the editable form.

## 6. Protected fields still protected

- As School Admin, try changing the school's `code` directly via the
  console (this field isn't exposed in the UI form at all, which is
  itself worth confirming — but let's also verify the backend still
  blocks it even if someone tried):
  ```js
  const { error } = await window.supabase.from('schools').update({ code: 'HACKED' }).eq('id', 'YOUR_SCHOOL_ID');
  console.log(error);
  ```
  This should fail with "Only a Super Admin can change a school's code"
  — a protection that's actually been in place since Phase 2, just never
  exercised by any UI until this phase gave School Admin real write
  access to the rest of the row.

## 7. Tenant isolation

- Confirm School B's admin editing their profile never affects School
  A's row, and that each school's logo lives in its own folder in the
  bucket (`{school_id}/logo.*`).

Report back what passes/fails. Once confirmed, Phase 22 — the final phase
— is next.
