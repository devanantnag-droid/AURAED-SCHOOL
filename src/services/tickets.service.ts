import { supabase } from '@/lib/supabase';
import type { Ticket, TicketCategory, TicketPriority, TicketReply, TicketStatus } from '@/types/tickets';

async function resolveNames(userIds: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((id): id is string => !!id))];
  if (ids.length === 0) return new Map();
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
  return new Map((data ?? []).map((p) => [p.id, p.full_name]));
}

// schoolId omitted → Super Admin view (RLS returns every school's tickets).
export async function listTickets(schoolId?: string): Promise<Ticket[]> {
  let query = supabase.from('tickets').select('*, schools(name)').order('created_at', { ascending: false });
  if (schoolId) query = query.eq('school_id', schoolId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const namesById = await resolveNames(rows.map((r) => r.created_by));

  return rows.map((r: any) => ({
    id: r.id,
    schoolId: r.school_id,
    schoolName: r.schools?.name,
    subject: r.subject,
    description: r.description,
    category: r.category,
    priority: r.priority,
    status: r.status,
    createdBy: r.created_by,
    createdByName: r.created_by ? namesById.get(r.created_by) : undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createTicket(input: {
  schoolId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('tickets').insert({
    school_id: input.schoolId,
    created_by: user?.id ?? null,
    subject: input.subject,
    description: input.description,
    category: input.category,
    priority: input.priority,
  });
  if (error) throw error;
}

export async function updateTicketTriage(id: string, updates: { status?: TicketStatus; priority?: TicketPriority }): Promise<void> {
  const patch: Record<string, string> = {};
  if (updates.status) patch.status = updates.status;
  if (updates.priority) patch.priority = updates.priority;
  const { error } = await supabase.from('tickets').update(patch as never).eq('id', id);
  if (error) throw error;
}

export async function listReplies(ticketId: string): Promise<TicketReply[]> {
  const { data, error } = await supabase
    .from('ticket_replies')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  const namesById = await resolveNames(rows.map((r) => r.sender_id));

  return rows.map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    senderId: r.sender_id,
    senderName: r.sender_id ? namesById.get(r.sender_id) : undefined,
    body: r.body,
    createdAt: r.created_at,
  }));
}

export async function addReply(ticketId: string, body: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('ticket_replies').insert({
    ticket_id: ticketId,
    sender_id: user?.id ?? null,
    body,
  });
  if (error) throw error;
}
