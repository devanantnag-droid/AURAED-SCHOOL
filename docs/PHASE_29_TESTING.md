# Phase 29 — Testing checklist (Platform-wide Announcements)

## 0. Apply what's new

1. Overwrite your project folder with the new files.
2. Run the new migration:
   - `supabase/migrations/0052_platform_announcements.sql`
3. `npm run supabase:types`
4. Restart `npm run dev`, hard-refresh.

## 1. Super Admin sends one

Log in as Super Admin → **Platform Announcements** → title/body, target
"Everyone, every school" → **Send announcement** → confirm it appears in
the list below.

## 2. School Admin sees it (persistent + notification)

Log in as School Admin (either test school) → confirm a **"Platform
notices"** card appears near the top of their Dashboard → confirm the
notification bell also shows it.

## 3. Reaches every role, not just School Admin

Log in as a teacher, then a student — confirm both get the notification
too (the persistent dashboard card is School-Admin-only for now; everyone
gets the bell notification regardless of role).

## 4. Role-targeted broadcast

As Super Admin, send a second one targeted at just "TEACHER" → confirm
only teacher accounts get notified, not students/school admins.

## 5. Tenant reach — confirm it's genuinely platform-wide

Confirm **both** School A and School B's users get the "Everyone"
broadcast — this is the one feature in the whole app that deliberately
isn't scoped to a single school.

## 6. Security check

While logged in as a School Admin, try sending one directly:
```js
const { error } = await window.supabase.from('platform_announcements').insert({ title: 'test', body: 'test', target_type: 'all' });
console.log(error);
```
This should fail — only Super Admin can write to this table.
