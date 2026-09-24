import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import { listLeaveRequests, reviewLeaveRequest } from '@/services/leave.service';
import type { LeaveRequest } from '@/services/leave.service';

export function ClassLeaveRequestsToReview() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  async function load() {
    try {
      // RLS returns the teacher's own leave history AND any pending
      // student leave requests for classes where they're the in-charge —
      // filter to just the student ones here, since that's what this
      // widget is for.
      const all = await listLeaveRequests();
      setRequests(all.filter((r) => r.requesterType === 'student' && r.status === 'pending'));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load leave requests.'));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    setErrorMsg(null);
    try {
      await reviewLeaveRequest(id, status, notesDraft[id]);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update the request.'));
    }
  }

  if (requests.length === 0 && !errorMsg) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Student leave requests to review</h2>
      {errorMsg && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
            <p className="font-medium text-primary-900 dark:text-gray-50">
              {r.requesterName} <span className="font-normal capitalize text-gray-500">· {r.leaveType} · {r.startDate} to {r.endDate}</span>
            </p>
            <p className="mb-2 text-gray-600 dark:text-gray-400">{r.reason}</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input flex-1"
                placeholder="Optional note…"
                value={notesDraft[r.id] ?? ''}
                onChange={(e) => setNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
              />
              <button onClick={() => handleReview(r.id, 'approved')} className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800">
                Approve
              </button>
              <button onClick={() => handleReview(r.id, 'rejected')} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800">
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
