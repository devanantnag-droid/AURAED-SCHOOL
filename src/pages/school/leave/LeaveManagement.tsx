import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { getErrorMessage } from '@/lib/errors';
import { listLeaveRequests, reviewLeaveRequest } from '@/services/leave.service';
import type { LeaveRequest, LeaveStatus } from '@/services/leave.service';
import { isNativeApp } from '@/lib/platform';
import { MobileLeave } from '@/components/mobile/MobileLeave';
import { Collapsible } from '@/components/shared/Collapsible';
import { PageHeader } from '@/components/shared/PageHeader';

const statusStyles: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

function LeaveManagementInner() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  async function loadAll() {
    if (!profile?.schoolId) return;
    try {
      setRequests(await listLeaveRequests(profile.schoolId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load leave requests.'));
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  const visible = statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter);

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    setErrorMsg(null);
    try {
      await reviewLeaveRequest(id, status, notesDraft[id]);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update the request.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Leave Management" subtitle="Approve or reject leave requests from teachers and students." />
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              statusFilter === s ? 'bg-primary-700 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">No leave requests match this filter.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((r) => (
            <li key={r.id} className="card p-3 text-sm">
              <Collapsible
                summary={
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-primary-900 dark:text-gray-50">
                        {r.requesterName ?? 'Unknown'} <span className="font-normal text-gray-500 capitalize">· {r.requesterType} · {r.leaveType}</span>
                      </p>
                      <p className="text-xs text-gray-500">{r.startDate} to {r.endDate}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[r.status]}`}>{r.status}</span>
                  </div>
                }
              >
                <p className="mb-2 text-gray-600 dark:text-gray-400">{r.reason}</p>
                {r.reviewNotes && <p className="mb-2 text-xs italic text-gray-500">Note: {r.reviewNotes}</p>}

                {r.status === 'pending' && r.requesterType === 'teacher' && (
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
                )}
                {r.status === 'pending' && r.requesterType === 'student' && (
                  <p className="text-xs italic text-gray-400">Awaiting the class in-charge teacher's decision.</p>
                )}
              </Collapsible>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LeaveManagementPage() {
  if (isNativeApp()) {
    return <MobileLeave />;
  }
  return (
    <FeatureGate feature="leave_management">
      <LeaveManagementInner />
    </FeatureGate>
  );
}
