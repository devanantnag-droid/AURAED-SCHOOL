import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import { addReply, listReplies, listTickets, updateTicketTriage } from '@/services/tickets.service';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '@/types/tickets';
import type { Ticket, TicketPriority, TicketReply, TicketStatus } from '@/types/tickets';
import { sendEmailBestEffort } from '@/services/email.service';

const statusStyles: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  closed: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function SuperAdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyDraft, setReplyDraft] = useState('');

  async function loadTickets() {
    try {
      setTickets(await listTickets());
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load tickets.'));
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const visibleTickets = statusFilter === 'all' ? tickets : tickets.filter((t) => t.status === statusFilter);

  async function toggleExpand(ticket: Ticket) {
    if (expandedId === ticket.id) {
      setExpandedId(null);
      return;
    }
    setReplies(await listReplies(ticket.id));
    setExpandedId(ticket.id);
  }

  async function handleReply(t: Ticket) {
    if (!replyDraft.trim()) return;
    setErrorMsg(null);
    try {
      await addReply(t.id, replyDraft);
      setReplyDraft('');
      setReplies(await listReplies(t.id));
      if (t.createdBy) {
        sendEmailBestEffort({
          userId: t.createdBy,
          subject: `New reply on your support ticket: ${t.subject}`,
          message: replyDraft,
        });
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to send reply.'));
    }
  }

  async function handleStatusChange(id: string, status: TicketStatus) {
    setErrorMsg(null);
    try {
      await updateTicketTriage(id, { status });
      loadTickets();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update status.'));
    }
  }

  async function handlePriorityChange(id: string, priority: TicketPriority) {
    setErrorMsg(null);
    try {
      await updateTicketTriage(id, { priority });
      loadTickets();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update priority.'));
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-gray-50">Support Tickets</h1>
      <p className="mb-5 text-sm text-gray-500">Every ticket raised by a School Admin, across every school.</p>

      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['all', ...TICKET_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              statusFilter === s ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {visibleTickets.length === 0 ? (
        <p className="text-sm text-gray-500">No tickets match this filter.</p>
      ) : (
        <ul className="max-w-3xl space-y-2">
          {visibleTickets.map((t) => (
            <li key={t.id} className="rounded-md border border-gray-200 text-sm dark:border-gray-800">
              <button onClick={() => toggleExpand(t)} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">{t.subject}</p>
                  <p className="text-xs text-gray-500">
                    {t.schoolName} · {t.createdByName ?? 'Unknown'} · {TICKET_CATEGORIES.find((c) => c.value === t.category)?.label} · {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[t.status]}`}>{t.status.replace('_', ' ')}</span>
              </button>

              {expandedId === t.id && (
                <div className="border-t border-gray-100 p-3 dark:border-gray-800">
                  <p className="mb-3 text-gray-600 dark:text-gray-400">{t.description}</p>

                  <div className="mb-3 flex flex-wrap gap-2">
                    <select className="input py-1 text-xs" value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value as TicketStatus)}>
                      {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                    <select className="input py-1 text-xs" value={t.priority} onChange={(e) => handlePriorityChange(t.id, e.target.value as TicketPriority)}>
                      {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{p} priority</option>)}
                    </select>
                  </div>

                  {replies.length > 0 && (
                    <ul className="mb-3 space-y-2">
                      {replies.map((r) => (
                        <li key={r.id} className="rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-900">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{r.senderName ?? 'School'}:</span> {r.body}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Write a reply…" value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} />
                    <button onClick={() => handleReply(t)} className="rounded-md bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700">
                      Send
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
