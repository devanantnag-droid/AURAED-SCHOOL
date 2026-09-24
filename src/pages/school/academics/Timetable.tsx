import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { isNativeApp } from '@/lib/platform';
import { MobileTimetable } from '@/components/mobile/MobileTimetable';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  deleteTimetableEntry,
  listClasses,
  listSections,
  listSessions,
  listSubjects,
  listTimetable,
  upsertTimetableEntry,
} from '@/services/academics.service';
import { listTeachers } from '@/services/teachers.service';
import { DAY_NAMES } from '@/types/academics';
import type { AcademicSession, ClassEntity, Section, Subject, TimetableEntry } from '@/types/academics';
import type { Teacher } from '@/types/people';

const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // Monday-Saturday default
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

function TimetableInner() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ day: number; period: number } | null>(null);
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formRoom, setFormRoom] = useState('');

  async function loadBase() {
    if (!profile?.schoolId) return;
    const [s, c, sub, t] = await Promise.all([
      listSessions(profile.schoolId),
      listClasses(profile.schoolId),
      listSubjects(profile.schoolId),
      listTeachers(profile.schoolId),
    ]);
    setSessions(s);
    setClasses(c);
    setSubjects(sub);
    setTeachers(t.filter((x) => x.status === 'active'));
    const current = s.find((x) => x.isCurrent) ?? s[0];
    if (current) setSessionId(current.id);
    if (c.length > 0) setClassId(c[0].id);
  }

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !classId) return;
    listSections(profile.schoolId, classId).then((secs) => {
      setSections(secs);
      if (secs.length > 0 && !secs.find((s) => s.id === sectionId)) setSectionId(secs[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId, classId]);

  async function loadTimetable() {
    if (!profile?.schoolId || !sessionId || !classId || !sectionId) return;
    try {
      setEntries(await listTimetable(profile.schoolId, sessionId, classId, sectionId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load timetable.'));
    }
  }

  useEffect(() => {
    loadTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId, sessionId, classId, sectionId]);

  function entryFor(day: number, period: number) {
    return entries.find((e) => e.dayOfWeek === day && e.periodNumber === period);
  }

  function openCell(day: number, period: number) {
    const existing = entryFor(day, period);
    setFormSubjectId(existing?.subjectId ?? '');
    setFormTeacherId(existing?.teacherId ?? '');
    setFormRoom(existing?.room ?? '');
    setErrorMsg(null);
    setEditingCell({ day, period });
  }

  async function handleSaveCell() {
    if (!profile?.schoolId || !editingCell || !formSubjectId || !formTeacherId) return;
    setErrorMsg(null);
    try {
      await upsertTimetableEntry({
        schoolId: profile.schoolId,
        sessionId,
        classId,
        sectionId,
        subjectId: formSubjectId,
        teacherId: formTeacherId,
        dayOfWeek: editingCell.day,
        periodNumber: editingCell.period,
        room: formRoom,
      });
      setEditingCell(null);
      loadTimetable();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to save timetable entry.'));
    }
  }

  async function handleDeleteCell() {
    const existing = editingCell && entryFor(editingCell.day, editingCell.period);
    if (!existing) return;
    setErrorMsg(null);
    try {
      await deleteTimetableEntry(existing.id);
      setEditingCell(null);
      loadTimetable();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to remove timetable entry.'));
    }
  }

  if (sessions.length === 0 || classes.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <PageHeader title="Timetable" subtitle="Set up an academic session and at least one class first." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <PageHeader
        title="Timetable"
        actions={
          <div className="flex flex-wrap gap-2">
            <select className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        }
      />

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <th className="border border-gray-200 px-2 py-2 dark:border-gray-800">Period</th>
              {WORKING_DAYS.map((d) => (
                <th key={d} className="border border-gray-200 px-2 py-2 dark:border-gray-800">
                  {DAY_NAMES[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => (
              <tr key={p}>
                <td className="border border-gray-200 px-2 py-2 text-center font-medium dark:border-gray-800">{p}</td>
                {WORKING_DAYS.map((d) => {
                  const e = entryFor(d, p);
                  return (
                    <td
                      key={d}
                      onClick={() => openCell(d, p)}
                      className="cursor-pointer border border-gray-200 px-2 py-2 text-center hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                    >
                      {e ? (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{e.subjectName}</p>
                          <p className="text-gray-500">{e.teacherName}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300">+</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingCell && (
        <PermissionGate code="academics.manage">
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg dark:bg-gray-900">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
                {DAY_NAMES[editingCell.day]} · Period {editingCell.period}
              </h2>

              <div className="mb-3 space-y-3">
                <select className="input" value={formSubjectId} onChange={(e) => setFormSubjectId(e.target.value)}>
                  <option value="">Subject…</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="input" value={formTeacherId} onChange={(e) => setFormTeacherId(e.target.value)}>
                  <option value="">Teacher…</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
                <input className="input" placeholder="Room (optional)" value={formRoom} onChange={(e) => setFormRoom(e.target.value)} />
              </div>

              <div className="flex justify-between">
                {entryFor(editingCell.day, editingCell.period) ? (
                  <button onClick={handleDeleteCell} className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCell(null)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCell}
                    disabled={!formSubjectId || !formTeacherId}
                    className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </PermissionGate>
      )}
    </div>
  );
}

export function TimetablePage() {
  if (isNativeApp()) {
    return <MobileTimetable />;
  }
  return (
    <FeatureGate feature="timetable">
      <TimetableInner />
    </FeatureGate>
  );
}
