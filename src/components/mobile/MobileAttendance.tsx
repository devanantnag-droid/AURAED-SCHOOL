import { useEffect, useState } from 'react';
import { Check, X, Clock, CalendarOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';
import { getErrorMessage } from '@/lib/errors';
import { listClassSections, getClassRoster, getAttendanceForDate, saveAttendance } from '@/services/attendance.service';
import type { RosterStudent } from '@/services/attendance.service';
import type { AttendanceStatus, ClassSection } from '@/types/attendance';
import { useNetworkState } from '@/lib/networkStatus';
import { enqueueAttendance, flushAttendanceQueue, useQueuedAttendanceCount } from '@/lib/offlineQueue';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: typeof Check }[] = [
  { value: 'present', label: 'P', icon: Check },
  { value: 'absent', label: 'A', icon: X },
  { value: 'late', label: 'L', icon: Clock },
  { value: 'leave', label: 'Lv', icon: CalendarOff },
];

const statusColors: Record<AttendanceStatus, string> = {
  present: 'bg-green-600 text-white border-green-600',
  absent: 'bg-red-600 text-white border-red-600',
  late: 'bg-amber-500 text-white border-amber-500',
  leave: 'bg-blue-500 text-white border-blue-500',
  holiday: 'bg-gray-400 text-white border-gray-400',
};

export function MobileAttendance() {
  const { profile } = useAuth();
  const network = useNetworkState();
  const queuedCount = useQueuedAttendanceCount();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // The moment the connection genuinely comes back (not just "wifi is
  // on" - the network state already accounts for real backend
  // reachability), try to flush anything saved locally while offline.
  useEffect(() => {
    if (network.connected && network.backendStatus === 'reachable' && queuedCount > 0) {
      flushAttendanceQueue((payload) =>
        saveAttendance({
          ...payload,
          entries: payload.entries.map((e) => ({ studentId: e.studentId, status: e.status as AttendanceStatus })),
        })
      ).then(({ synced, failed }) => {
        if (synced > 0) setSyncMsg(`${synced} offline attendance record${synced === 1 ? '' : 's'} synchronized.`);
        if (failed > 0) setSyncMsg((prev) => `${prev ?? ''} ${failed} still pending — will retry.`.trim());
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.connected, network.backendStatus]);

  useEffect(() => {
    if (!profile?.schoolId) return;
    listClassSections(profile.schoolId).then(setSections).catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load classes.')));
  }, [profile?.schoolId]);

  const selected = sections.find((s) => `${s.classId}|${s.sectionId}` === selectedKey);

  useEffect(() => {
    if (!profile?.schoolId || !selected) {
      setRoster([]);
      return;
    }
    setLoadingRoster(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    getClassRoster(profile.schoolId, selected.classId, selected.sectionId)
      .then(async (students) => {
        setRoster(students);
        const existing = await getAttendanceForDate(students.map((s) => s.id), date);
        const initial: Record<string, AttendanceStatus> = {};
        students.forEach((s) => {
          initial[s.id] = existing.get(s.id)?.status ?? 'present';
        });
        setMarks(initial);
      })
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load the class roster.')))
      .finally(() => setLoadingRoster(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId, selectedKey, date]);

  function markAllPresent() {
    const next: Record<string, AttendanceStatus> = {};
    roster.forEach((s) => (next[s.id] = 'present'));
    setMarks(next);
  }

  async function handleSave() {
    if (!profile?.schoolId || !selected) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      schoolId: profile.schoolId,
      className: selected.className,
      sectionName: selected.sectionName,
      date,
      entries: roster.map((s) => ({ studentId: s.id, status: marks[s.id] ?? 'present' })),
    };

    // The device may report a network interface as "up" while the
    // backend itself is unreachable — network.backendStatus already
    // accounts for that, so this is the same check used everywhere
    // else, not a separate weaker one.
    if (!network.connected || network.backendStatus !== 'reachable') {
      enqueueAttendance(payload);
      setSuccessMsg('Saved locally — no connection right now. It will sync automatically once you\u2019re back online.');
      setSaving(false);
      return;
    }

    try {
      await saveAttendance({
        ...payload,
        entries: payload.entries.map((e) => ({ studentId: e.studentId, status: e.status as AttendanceStatus })),
      });
      setSuccessMsg('Saved to server.');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to save attendance.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <MobileDetailHeader title="Attendance" />

      <div className="p-4">
        <div className="mb-3 flex gap-2">
          <select className="input flex-1" value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
            <option value="">Select class…</option>
            {sections.map((s) => (
              <option key={`${s.classId}|${s.sectionId}`} value={`${s.classId}|${s.sectionId}`}>
                {s.className} - {s.sectionName}
              </option>
            ))}
          </select>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {queuedCount > 0 && (
          <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            {queuedCount} attendance record{queuedCount === 1 ? '' : 's'} saved locally, waiting to sync.
          </p>
        )}
        {syncMsg && <p className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">{syncMsg}</p>}
        {errorMsg && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
        {successMsg && <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{successMsg}</p>}

        {loadingRoster ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : !selected ? (
          <p className="py-8 text-center text-sm text-gray-500">Pick a class and section to begin.</p>
        ) : roster.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No active students in this class.</p>
        ) : (
          <>
            <button onClick={markAllPresent} className="mb-3 w-full rounded-md border border-green-600 py-2 text-sm font-medium text-green-700 dark:text-green-400">
              Mark all present
            </button>

            <ul className="mb-4 space-y-2">
              {roster.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5 dark:border-gray-800">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{s.rollNumber ?? s.admissionNumber}</p>
                  </div>
                  <div className="flex gap-1">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setMarks((prev) => ({ ...prev, [s.id]: opt.value }))}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
                          marks[s.id] === opt.value ? statusColors[opt.value] : 'border-gray-300 text-gray-500 dark:border-gray-700'
                        }`}
                        aria-label={opt.value}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving…' : 'Save attendance'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
