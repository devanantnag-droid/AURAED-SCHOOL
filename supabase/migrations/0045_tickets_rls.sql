-- AURAED SCHOOL — Phase 23: RLS for tickets/ticket_replies
-- Run after 0044_tickets.sql.

alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;

-- =========================================================================
-- TICKETS — School Admin can see and create their own school's tickets,
-- but cannot change status/priority/assigned_to after creation — triage
-- is Super Admin's job, the same asymmetry as Admissions' status pipeline
-- but with the roles reversed. If a School Admin needs to add more
-- context, they reply instead of editing the ticket.
-- =========================================================================
create policy tickets_select on public.tickets
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('tickets.view'))
  );

create policy tickets_insert on public.tickets
  for insert with check (
    school_id = public.user_school_id()
    and public.user_has_permission('tickets.manage')
    and created_by = auth.uid()
  );

create policy tickets_update_super_admin on public.tickets
  for update using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- No delete policy — tickets are a permanent record, like audit_logs.

-- =========================================================================
-- TICKET REPLIES — visible to anyone who can see the parent ticket
-- (School Admin at that school, or Super Admin); either side can reply.
-- =========================================================================
create policy ticket_replies_select on public.ticket_replies
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or exists (
      select 1 from public.tickets t
      where t.id = ticket_replies.ticket_id
        and t.school_id = public.user_school_id()
        and public.user_has_permission('tickets.view')
    )
  );

create policy ticket_replies_insert on public.ticket_replies
  for insert with check (
    sender_id = auth.uid()
    and (
      public.user_has_role('SUPER_ADMIN')
      or exists (
        select 1 from public.tickets t
        where t.id = ticket_replies.ticket_id
          and t.school_id = public.user_school_id()
          and public.user_has_permission('tickets.manage')
      )
    )
  );

-- No update/delete policy — replies are permanent, like messages.
