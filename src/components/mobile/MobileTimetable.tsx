import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';
import { getErrorMessage } from '@/lib/errors';
import { getMyTeacherId } from '@/services/punch.service';
import { listSessions, listTeacherTimetable } from '@/services/academics.service';
import type { TimetableEntry } from '@/types/academics';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Most school weeks run Monday-Saturday; keep Sunday available but not
// the default tab.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function MobileTimetable() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const todayIndex = new Date().getDay();
  const [activeDay, setActiveDay] = useState(DAY_ORDER.includes(todayIndex) ? todayIndex : 1);

  useEffect(() => {
    if (!profile?.schoolId) return;
    (async () => {
      try {
        const teacherId = await getMyTeacherId();
        if (!teacherId) {
          setErrorMsg('Your account isn\u2019t linked to a teacher record yet.');
          return;
        }
        const sessions = await listSessions(profile.schoolId!);
        const current = sessions.find((s) => s.isCurrent) ?? sessions[0];
        if (!current) return;
        setEntries(await listTeacherTimetable(profile.schoolId!, current.id, teacherId));
      } catch (err) {
        setErrorMsg(getErrorMessage(err, 'Failed to load your timetable.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.schoolId]);

  const dayEntries = entries
    .filter((e) => e.dayOfWeek === activeDay)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  return (
    <div>
      <MobileDetailHeader title="Timetable" />

      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800">
        {DAY_ORDER.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`flex-shrink-0 px-3 py-2 text-xs font-medium ${
              activeDay === day ? 'border-b-2 border-primary-600 text-primary-700 dark:text-primary-300' : 'text-gray-500'
            }`}
          >
            {DAY_NAMES[day].slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="p-4">
        {errorMsg && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : dayEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
            <CalendarClock size={32} />
            <p className="text-sm">No periods scheduled for {DAY_NAMES[activeDay]}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {dayEntries.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{e.subjectName ?? 'Subject'}</p>
                  <p className="text-xs text-gray-500">
                    {e.className} - {e.sectionName} · Period {e.periodNumber}
                  </p>
                </div>
                {e.startTime && (
                  <p className="text-xs text-gray-500">
                    {e.startTime}
                    {e.endTime ? ` – ${e.endTime}` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
