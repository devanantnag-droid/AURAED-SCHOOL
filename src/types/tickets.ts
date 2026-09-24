export type TicketCategory = 'bug' | 'feature_request' | 'support' | 'billing' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  schoolId: string;
  schoolName?: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: string | null;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  senderId: string | null;
  senderName?: string;
  body: string;
  createdAt: string;
}

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'bug', label: 'Bug report' },
  { value: 'feature_request', label: 'Feature request' },
  { value: 'support', label: 'Support / how-to' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Other' },
];

export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
