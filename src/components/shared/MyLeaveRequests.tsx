import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import { createLeaveRequest, listLeaveRequests, LEAVE_TYPES } from '@/services/leave.service';
import type { LeaveRequest, LeaveType, RequesterType } from '@/services/leave.service';

const statusStyles: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

interface Props {
  schoolId: string;
  requesterType: RequesterType;
  teacherId?: string;
  studentId?: string;
}

export function MyLeaveRequests({ schoolId, requesterType, teacherId, studentId }: Props) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  async function load() {
    try {
      setRequests(await listLeaveRequests());
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load your leave requests.'));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!startDate || !endDate || !reason.trim()) return;
    setErrorMsg(null);
    try {
      await createLeaveRequest({ schoolId, requesterType, teacherId, studentId, leaveType, startDate, endDate, reason });
      setStartDate('');
      setEndDate('');
      setReason('');
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to submit leave request.'));
    }
  }

  return (
    <div>
      {errorMsg && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <div className="mb-4 rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-primary-900 dark:text-gray-50">Request leave</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          <select className="input" value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}>
            {LEAVE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <textarea className="input mb-3 w-full" rows={2} placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button onClick={handleSubmit} className="btn-primary">Submit request</button>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">No leave requests yet.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="rounded-md border border-gray-200 p-2 text-sm dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="capitalize">{r.leaveType} · {r.startDate} to {r.endDate}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[r.status]}`}>{r.status}</span>
              </div>
              {r.reviewNotes && <p className="mt-1 text-xs italic text-gray-500">Note: {r.reviewNotes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
