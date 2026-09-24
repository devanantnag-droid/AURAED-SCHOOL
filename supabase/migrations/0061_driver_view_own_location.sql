-- AURAED SCHOOL — Phase 40: Grant DRIVER view permission on their own location
-- Run after 0001-0060.
--
-- DRIVER was only ever granted vehicle_location.share, never
-- vehicle_location.view. Supabase's .upsert() asks Postgres to return
-- the affected row by default (Prefer: return=representation) — when a
-- row is inserted successfully but the inserting role has no SELECT
-- visibility into it per the table's own select policy, Postgres
-- raises the exact same "new row violates row-level security policy"
-- error as a WITH CHECK failure, even though the actual write itself
-- was fine. A driver being able to see their own vehicle's current
-- location is also just reasonable on its own merits.

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'DRIVER' and p.code = 'vehicle_location.view'
on conflict do nothing;
