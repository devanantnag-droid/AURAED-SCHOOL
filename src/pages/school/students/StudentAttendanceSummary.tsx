import { useEffect, useState } from 'react';
import { getStudentAttendanceHistory, getStudentAttendancePercentage } from '@/services/attendance.service';
import { PermissionGate } from '@/components/layout/PermissionGate';
import type { AttendanceRecord } from '@/types/attendance';

const statusStyles: Record<string, string> = {
  present: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  leave: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  holiday: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function StudentAttendanceSummary({ studentId }: { studentId: string }) {
  const [percentage, setPercentage] = useState<number | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStudentAttendancePercentage(studentId), getStudentAttendanceHistory(studentId, 10)])
      .then(([pct, hist]) => {
        setPercentage(pct);
        setHistory(hist);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <PermissionGate code="attendance.view">
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Attendance</h2>
          {percentage !== null && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{percentage}% present</span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">No attendance recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            {history.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-3 py-2">
                <span className="text-gray-700 dark:text-gray-300">{r.attendanceDate}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[r.status]}`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PermissionGate>
  );
}
