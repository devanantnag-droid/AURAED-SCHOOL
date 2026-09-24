import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';
import { useHasAnyPermission } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/errors';
import { getMyTeacherId } from '@/services/punch.service';
import { listLeaveRequests, reviewLeaveRequest } from '@/services/leave.service';
import type { LeaveRequest } from '@/services/leave.service';
import { MyLeaveRequests } from '@/components/shared/MyLeaveRequests';
import { ClassLeaveRequestsToReview } from '@/components/shared/ClassLeaveRequestsToReview';

const statusStyles: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

// School Admin's approve/reject queue for teacher leave requests - a
// compact version of the same view the desktop LeaveManagement page
// shows, reused here rather than duplicated with different behavior.
function AdminQueue() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  async function load() {
    if (!profile?.schoolId) return;
    try {
      setRequests((await listLeaveRequests(profile.schoolId)).filter((r) => r.requesterType === 'teacher' && r.status === 'pending'));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load leave requests.'));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    try {
      await reviewLeaveRequest(id, status, notesDraft[id]);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update the request.'));
    }
  }

  if (requests.length === 0 && !errorMsg) return null;

  return (
    <section className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Teacher leave requests to approve</p>
      {errorMsg && <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
            <div className="mb-1 flex items-center justify-between">
              <p className="font-medium text-primary-900 dark:text-gray-50">{r.requesterName}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[r.status]}`}>{r.status}</span>
            </div>
            <p className="mb-2 text-xs capitalize text-gray-500">{r.leaveType} · {r.startDate} to {r.endDate}</p>
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

export function MobileLeave() {
  const { profile } = useAuth();
  const canManage = useHasAnyPermission(['leave.manage']);
  const canApprove = useHasAnyPermission(['leave.view']);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (canManage) getMyTeacherId().then(setTeacherId);
  }, [canManage]);

  return (
    <div>
      <MobileDetailHeader title="Leave" />
      <div className="p-4">
        {canApprove && <AdminQueue />}

        <ClassLeaveRequestsToReview />

        {canManage && teacherId && profile?.schoolId && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">My leave</p>
            <MyLeaveRequests schoolId={profile.schoolId} requesterType="teacher" teacherId={teacherId} />
          </section>
        )}
      </div>
    </div>
  );
}
