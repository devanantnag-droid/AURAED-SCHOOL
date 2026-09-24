-- AURAED SCHOOL — Phase 33: Platform announcement delete should reach recipients
-- Run after 0001-0053.
--
-- Previously, deleting a platform_announcements row only removed it from
-- Super Admin's own list — the individual notifications already fanned
-- out to every recipient had no link back to it, so they stayed in
-- everyone's bell forever. Adding that link with ON DELETE CASCADE means
-- deleting the announcement now genuinely un-sends it everywhere.

alter table public.notifications
  add column if not exists platform_announcement_id uuid references public.platform_announcements(id) on delete cascade;

create index if not exists idx_notifications_platform_announcement on public.notifications(platform_announcement_id);

-- Re-point the fan-out trigger to set this new column.
create or replace function public.trg_notify_platform_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.target_type = 'all' then
    insert into public.notifications (school_id, user_id, type, title, body, link, platform_announcement_id)
    select ur.school_id, ur.user_id, 'platform_announcement', new.title, left(new.body, 200), null, new.id
    from public.user_roles ur
    where ur.school_id is not null;
  elsif new.target_type = 'role' then
    insert into public.notifications (school_id, user_id, type, title, body, link, platform_announcement_id)
    select ur.school_id, ur.user_id, 'platform_announcement', new.title, left(new.body, 200), null, new.id
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.school_id is not null and r.name = new.target_role;
  end if;
  return new;
end;
$$;
