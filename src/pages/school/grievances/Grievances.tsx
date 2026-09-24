import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { getErrorMessage } from '@/lib/errors';
import {
  addGrievanceReply,
  listGrievanceReplies,
  listGrievances,
  updateGrievanceStatus,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STATUSES,
} from '@/services/grievances.service';
import type { Grievance, GrievanceReply, GrievanceStatus } from '@/services/grievances.service';
import { sendEmailBestEffort } from '@/services/email.service';
import { PageHeader } from '@/components/shared/PageHeader';

const statusStyles: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  closed: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// Each row manages its own expanded state and its own replies — this is
// what lets every item start expanded at once, instead of the old
// single-shared-state accordion where opening one closed the others.
function GrievanceRow({ g, onStatusChange, onError }: { g: Grievance; onStatusChange: (id: string, status: GrievanceStatus) => void; onError: (msg: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [replies, setReplies] = useState<GrievanceReply[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');

  useEffect(() => {
    if (expanded && !repliesLoaded) {
      listGrievanceReplies(g.id)
        .then((r) => {
          setReplies(r);
          setRepliesLoaded(true);
        })
        .catch((err) => onError(getErrorMessage(err, 'Failed to load replies.')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  async function handleReply() {
    if (!replyDraft.trim()) return;
    try {
      await addGrievanceReply(g.id, replyDraft);
      const draft = replyDraft;
      setReplyDraft('');
      setReplies(await listGrievanceReplies(g.id));
      if (g.raisedBy) {
        sendEmailBestEffort({
          userId: g.raisedBy,
          subject: `New reply on your grievance: ${g.subject}`,
          message: draft,
        });
      }
    } catch (err) {
      onError(getErrorMessage(err, 'Failed to send reply.'));
    }
  }

  return (
    <li className="rounded-md border border-gray-200 text-sm dark:border-gray-800">
      <button onClick={() => setExpanded((e) => !e)} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-50">{g.subject}</p>
          <p className="text-xs text-gray-500">
            {g.studentName} · {GRIEVANCE_CATEGORIES.find((c) => c.value === g.category)?.label}
            {g.againstTeacherName && ` · Re: ${g.againstTeacherName}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[g.status]}`}>{g.status.replace('_', ' ')}</span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-3 dark:border-gray-800">
          <p className="mb-3 text-gray-600 dark:text-gray-400">{g.description}</p>

          <div className="mb-3">
            <select className="input py-1 text-xs" value={g.status} onChange={(e) => onStatusChange(g.id, e.target.value as GrievanceStatus)}>
              {GRIEVANCE_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          {replies.length > 0 && (
            <ul className="mb-3 space-y-2">
              {replies.map((r) => (
                <li key={r.id} className="rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-900">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{r.senderName ?? 'Parent/Student'}:</span> {r.body}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Write a reply…" value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} />
            <button onClick={handleReply} className="rounded-md bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700">
              Send
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export function GrievancesPage() {
  const { profile } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | GrievanceStatus>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadAll() {
    if (!profile?.schoolId) return;
    try {
      setGrievances(await listGrievances(profile.schoolId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load grievances.'));
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  const visible = statusFilter === 'all' ? grievances : grievances.filter((g) => g.status === statusFilter);

  async function handleStatusChange(id: string, status: GrievanceStatus) {
    setErrorMsg(null);
    try {
      await updateGrievanceStatus(id, status);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update status.'));
    }
  }

  return (
    <FeatureGate feature="grievances">
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Grievances" subtitle="Complaints raised by parents and students. Kept private — a named teacher is never automatically shown a grievance against them." />
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['all', ...GRIEVANCE_STATUSES] as const).map((s) => (
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

      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">No grievances match this filter.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((g) => (
            <GrievanceRow key={g.id} g={g} onStatusChange={handleStatusChange} onError={setErrorMsg} />
          ))}
        </ul>
      )}
    </div>
    </FeatureGate>
  );
}
