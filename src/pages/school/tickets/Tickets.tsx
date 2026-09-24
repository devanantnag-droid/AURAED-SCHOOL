import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { getErrorMessage } from '@/lib/errors';
import { addReply, createTicket, listReplies, listTickets } from '@/services/tickets.service';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '@/types/tickets';
import type { Ticket, TicketCategory, TicketPriority, TicketReply } from '@/types/tickets';
import { PageHeader } from '@/components/shared/PageHeader';

const statusStyles: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  closed: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function TicketsInner() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyDraft, setReplyDraft] = useState('');

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('support');
  const [priority, setPriority] = useState<TicketPriority>('medium');

  async function loadTickets() {
    if (!profile?.schoolId) return;
    setTickets(await listTickets(profile.schoolId));
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleCreate() {
    if (!profile?.schoolId || !subject.trim() || !description.trim()) return;
    setErrorMsg(null);
    try {
      await createTicket({ schoolId: profile.schoolId, subject, description, category, priority });
      setSubject('');
      setDescription('');
      loadTickets();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to raise ticket.'));
    }
  }

  async function toggleExpand(ticket: Ticket) {
    if (expandedId === ticket.id) {
      setExpandedId(null);
      return;
    }
    setReplies(await listReplies(ticket.id));
    setExpandedId(ticket.id);
  }

  async function handleReply(ticketId: string) {
    if (!replyDraft.trim()) return;
    setErrorMsg(null);
    try {
      await addReply(ticketId, replyDraft);
      setReplyDraft('');
      setReplies(await listReplies(ticketId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to send reply.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Support Tickets" subtitle="Report a bug, request a feature, or ask for help — Super Admin will respond here." />
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <PermissionGate code="tickets.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Raise a ticket</h2>
          <input className="input mb-3 w-full" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className="input mb-3 w-full" rows={3} placeholder="Describe the issue or request in detail" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="mb-3 flex flex-wrap gap-2">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)}>
              {TICKET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
              {TICKET_PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Submit ticket
          </button>
        </section>
      </PermissionGate>

      {tickets.length === 0 ? (
        <p className="text-sm text-gray-500">No tickets raised yet.</p>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li key={t.id} className="rounded-md border border-gray-200 text-sm dark:border-gray-800">
              <button onClick={() => toggleExpand(t)} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">{t.subject}</p>
                  <p className="text-xs text-gray-500">
                    {TICKET_CATEGORIES.find((c) => c.value === t.category)?.label} · {t.priority} priority · {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[t.status]}`}>{t.status.replace('_', ' ')}</span>
              </button>

              {expandedId === t.id && (
                <div className="border-t border-gray-100 p-3 dark:border-gray-800">
                  <p className="mb-3 text-gray-600 dark:text-gray-400">{t.description}</p>
                  {replies.length > 0 && (
                    <ul className="mb-3 space-y-2">
                      {replies.map((r) => (
                        <li key={r.id} className="rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-900">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{r.senderName ?? 'Support'}:</span> {r.body}
                        </li>
                      ))}
                    </ul>
                  )}
                  {t.status !== 'closed' && (
                    <div className="flex gap-2">
                      <input className="input flex-1" placeholder="Write a reply…" value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} />
                      <button onClick={() => handleReply(t.id)} className="rounded-md bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700">
                        Send
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TicketsPage() {
  return (
    <FeatureGate feature="tickets">
      <TicketsInner />
    </FeatureGate>
  );
}
