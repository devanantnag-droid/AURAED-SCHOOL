-- AURAED SCHOOL — Phase 23: Ticket Raise System
-- Run after 0001-0043.
--
-- Not feature-gated by plan — every School Admin can always reach Super
-- Admin support, regardless of what plan their school is on, same as
-- Settings/Subscription pages.

-- =========================================================================
-- TICKETS
-- =========================================================================
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  subject text not null,
  description text not null,
  category text not null default 'other' check (category in ('bug', 'feature_request', 'support', 'billing', 'other')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tickets_school_id on public.tickets(school_id);
create index if not exists idx_tickets_status on public.tickets(status);

-- =========================================================================
-- TICKET REPLIES — a simple threaded conversation. Insert-only (like
-- messages), no editing history to keep the exchange trustworthy.
-- =========================================================================
create table if not exists public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ticket_replies_ticket on public.ticket_replies(ticket_id);

drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at before update on public.tickets
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_tickets on public.tickets;
create trigger trg_audit_tickets
  after insert or update or delete on public.tickets
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('tickets.view', 'View support tickets raised by the school'),
  ('tickets.manage', 'Raise support tickets and reply to them')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('tickets.view', 'tickets.manage')
on conflict do nothing;
