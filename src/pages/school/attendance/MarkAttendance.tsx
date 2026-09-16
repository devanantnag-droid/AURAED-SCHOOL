import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import {
  getAttendanceForDate,
  getClassRoster,
  listClassSections,
  saveAttendance,
  type RosterStudent,
} from '@/services/attendance.service';
import type { AttendanceStatus, ClassSection } from '@/types/attendance';
import { getErrorMessage } from '@/lib/errors';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; className: string }[] = [
  { value: 'present', label: 'Present', className: 'bg-green-600 text-white' },
  { value: 'absent', label: 'Absent', className: 'bg-red-600 text-white' },
  { value: 'late', label: 'Late', className: 'bg-amber-500 text-white' },
  { value: 'leave', label: 'Leave', className: 'bg-blue-500 text-white' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function MarkAttendanceInner() {
  const { profile } = useAuth();
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const selected = classSections.find((cs) => cs.sectionId === selectedSectionId) ?? null;

  useEffect(() => {
    if (!profile?.schoolId) return;
    listClassSections(profile.schoolId).then((list) => {
      setClassSections(list);
      if (list.length > 0) {
        setSelectedSectionId(list[0].sectionId);
      }
    });
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !selected) return;

    setLoading(true);
    setErrorMsg(null);
    setSavedMsg(null);

    getClassRoster(profile.schoolId, selected.classId, selected.sectionId)
      .then(async (students) => {
        setRoster(students);
        const existing = await getAttendanceForDate(
          students.map((s) => s.id),
          date
        );
        const initial: Record<string, AttendanceStatus> = {};
        students.forEach((s) => {
          initial[s.id] = existing.get(s.id)?.status ?? 'present';
        });
        setStatuses(initial);
      })
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load class roster.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId, selectedSectionId, date]);

  function markAll(status: AttendanceStatus) {
    setStatuses((prev) => {
      const next = { ...prev };
      roster.forEach((s) => {
        next[s.id] = status;
      });
      return next;
    });
  }

  async function handleSave() {
    if (!profile?.schoolId || !selected) return;

    setSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      await saveAttendance({
        schoolId: profile.schoolId,
        className: selected.className,
        sectionName: selected.sectionName,
        date,
        entries: roster.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? 'present' })),
      });
      setSavedMsg(`Attendance saved for ${roster.length} student(s) on ${date}.`);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to save attendance.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-50">Mark Attendance</h1>

      {classSections.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <CalendarCheck className="text-gray-300" size={32} />
          <p className="text-sm text-gray-500">
            No classes/sections set up yet.{' '}
            <Link to="/school/academics" className="text-primary-600 hover:underline">
              Set up classes and sections
            </Link>{' '}
            first.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Class / Section</label>
              <select className="input" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)}>
                {classSections.map((cs) => (
                  <option key={cs.sectionId} value={cs.sectionId}>
                    {cs.className} - {cs.sectionName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {errorMsg && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {errorMsg}
            </p>
          )}
          {savedMsg && (
            <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              {savedMsg}
            </p>
          )}

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : roster.length === 0 ? (
            <p className="text-sm text-gray-500">No active students in this class/section.</p>
          ) : (
            <>
              <div className="mb-3 flex gap-2 text-xs">
                <span className="text-gray-500">Quick actions:</span>
                <button onClick={() => markAll('present')} className="text-primary-600 hover:underline">
                  Mark all present
                </button>
                <button onClick={() => markAll('absent')} className="text-primary-600 hover:underline">
                  Mark all absent
                </button>
              </div>

              <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {roster.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s.rollNumber ? `Roll ${s.rollNumber}` : s.admissionNumber}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: opt.value }))}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                            statuses[s.id] === opt.value
                              ? opt.className
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>

              <PermissionGate code="attendance.create">
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save attendance'}
                  </button>
                </div>
              </PermissionGate>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function MarkAttendancePage() {
  return (
    <FeatureGate feature="attendance">
      <MarkAttendanceInner />
    </FeatureGate>
  );
}
