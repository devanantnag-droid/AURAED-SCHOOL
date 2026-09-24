import { useEffect, useState } from 'react';
import { Armchair } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { listMySeatAssignments } from '@/services/examSeating.service';
import type { MySeatAssignment } from '@/services/examSeating.service';

export function MySeatAssignments({ studentId }: { studentId: string }) {
  const [seats, setSeats] = useState<MySeatAssignment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMySeatAssignments(studentId)
      .then(setSeats)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load seating.')))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (errorMsg) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>;
  if (seats.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-gray-400">
        <Armchair size={28} />
        <p className="text-sm">No exam seating assigned yet</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {seats.map((s) => (
        <li key={s.id} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
          <p className="font-medium text-gray-900 dark:text-gray-50">{s.examName}</p>
          <p className="text-xs text-gray-500">
            Room <span className="font-medium text-gray-700 dark:text-gray-300">{s.roomName}</span>, Seat{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{s.seatNumber}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
