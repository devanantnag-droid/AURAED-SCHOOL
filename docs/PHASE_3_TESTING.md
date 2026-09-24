# Phase 3 — Testing checklist

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the two new migrations, in order, the same way as before (Notepad →
   copy → paste into a new Supabase SQL Editor query → Run):
   - `supabase/migrations/0004_plans_subscriptions.sql`
   - `supabase/migrations/0005_plans_subscriptions_rls.sql`
3. Restart `npm run dev`, hard-refresh the browser.

## 1. Features catalog

Log in as Super Admin (`super@gmail.com`).

- Go to `/super-admin/plans` → **Manage features**. You should see ~26
  pre-seeded features (Attendance, Fees, Library, etc.) — these came from
  the migration, not typed in by you.
- Add a custom feature (e.g. code `custom_module`, name "Custom Module").
  Confirm it appears in the list.

## 2. Plans CRUD

- Go to `/super-admin/plans` → **New plan**. Fill in name (e.g. "Standard"),
  slug (e.g. `standard`), price, trial days, and check a handful of
  features (e.g. Student Management, Attendance, Fees). Save.
- Confirm it shows up as a card with the right feature count.
- Click **Edit**, uncheck a feature, save, confirm the count dropped.
- Click **Duplicate** — confirm a "(copy)" version appears.
- Click **Deactivate** on one plan — confirm dialog appears, confirm it,
  badge flips to "Inactive".

## 3. Assign a subscription to a school

- Go to a school's detail page (e.g. "chukle" or "Demo School").
- Scroll to the **Subscription** section. Pick a plan, set status to
  `trial`, leave dates as default, click **Assign subscription**.
- Confirm the status badge appears (should show "trial").
- Change status to `active`, save again, confirm badge updates.

## 4. School-side view

- Log in as that school's admin (e.g. `devang@gmail.com` for Demo School,
  or the invited admin for "chukle").
- You should now see a sidebar with **Dashboard** and **Subscription**.
- Dashboard should show a small "Plan: ... [status]" pill.
- Click **Subscription** in the sidebar — confirm it shows the plan name,
  price, dates, and student limit correctly.

## 5. Feature gating (the core of Phase 3)

This is the important one — it proves the gate actually blocks access, not
just hides a UI element.

While logged in as that school's admin, open the browser console
(`allow pasting` if prompted) and run:

```js
// Should be TRUE if you included 'attendance' in the assigned plan's features
const { data: hasAttendance } = await window.supabase.rpc('school_has_feature', { feature_code: 'attendance' });
console.log('has attendance:', hasAttendance);

// Should be FALSE if you did NOT include this in the plan
const { data: hasPayroll } = await window.supabase.rpc('school_has_feature', { feature_code: 'payroll' });
console.log('has payroll:', hasPayroll);
```

Confirm the results match exactly which features you checked when creating
the plan.

## 6. Suspend a subscription and confirm data stays intact

- As Super Admin, go back to the school's detail page → Subscription
  section → click **Suspend**. Confirm the dialog, confirm it.
- Log in as that school's admin again. The Subscription page should now
  show a red "Your subscription is suspended..." message.
- Run the feature check again from the console — it should now return
  `false` for every feature, even ones the plan includes (suspension
  overrides plan features).
- Confirm the school itself, its profile, and all its data are still there
  in the database (Table Editor) — suspension never deletes anything, per
  spec §9.
- Reactivate it from the Super Admin side and confirm access returns.

## 7. Negative tests

- Log in as a School Admin and try, from the console:
  ```js
  await window.supabase.from('plans').insert({ name: 'Hack', slug: 'hack', price: 0 });
  ```
  Should fail — only Super Admin can write to `plans`.
- Try assigning your own school a different plan directly:
  ```js
  await window.supabase.from('subscriptions').update({ plan_id: 'some-other-plan-id' }).eq('school_id', 'your-school-id');
  ```
  Should fail — only Super Admin can write to `subscriptions`.

Report back what passes/fails and we'll fix anything broken before Phase 4
(School Admin dashboard + Students/Parents/Teachers/Staff CRUD).
