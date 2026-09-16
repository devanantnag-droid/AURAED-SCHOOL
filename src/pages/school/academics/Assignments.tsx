import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import {
  assignClassTeacher,
  assignSubjectTeacher,
  listClassTeachers,
  listClasses,
  listSections,
  listSessions,
  listSubjectTeachers,
  listSubjects,
} from '@/services/academics.service';
import { listTeachers } from '@/services/teachers.service';
import type { AcademicSession, ClassEntity, ClassTeacherAssignment, Section, Subject, SubjectTeacherAssignment } from '@/types/academics';
import type { Teacher } from '@/types/people';

export function AssignmentsPage() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classTeacherAssignments, setClassTeacherAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [subjectTeacherAssignments, setSubjectTeacherAssignments] = useState<SubjectTeacherAssignment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Class teacher form state
  const [ctClassId, setCtClassId] = useState('');
  const [ctSectionId, setCtSectionId] = useState('');
  const [ctTeacherId, setCtTeacherId] = useState('');

  // Subject teacher form state
  const [stClassId, setStClassId] = useState('');
  const [stSectionId, setStSectionId] = useState('');
  const [stSubjectId, setStSubjectId] = useState('');
  const [stTeacherId, setStTeacherId] = useState('');

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
  }

  async function loadAssignments() {
    if (!profile?.schoolId || !sessionId) return;
    const [ct, st, sec] = await Promise.all([
      listClassTeachers(profile.schoolId, sessionId),
      listSubjectTeachers(profile.schoolId, sessionId),
      listSections(profile.schoolId),
    ]);
    setClassTeacherAssignments(ct);
    setSubjectTeacherAssignments(st);
    setSections(sec);
  }

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId, sessionId]);

  async function handleAssignClassTeacher() {
    if (!profile?.schoolId || !sessionId || !ctClassId || !ctSectionId || !ctTeacherId) return;
    setErrorMsg(null);
    try {
      await assignClassTeacher({ schoolId: profile.schoolId, sessionId, classId: ctClassId, sectionId: ctSectionId, teacherId: ctTeacherId });
      setCtTeacherId('');
      loadAssignments();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to assign class teacher.'));
    }
  }

  async function handleAssignSubjectTeacher() {
    if (!profile?.schoolId || !sessionId || !stClassId || !stSectionId || !stSubjectId || !stTeacherId) return;
    setErrorMsg(null);
    try {
      await assignSubjectTeacher({
        schoolId: profile.schoolId,
        sessionId,
        classId: stClassId,
        sectionId: stSectionId,
        subjectId: stSubjectId,
        teacherId: stTeacherId,
      });
      setStTeacherId('');
      loadAssignments();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to assign subject teacher.'));
    }
  }

  function classNameOf(id: string) {
    return classes.find((c) => c.id === id)?.name ?? id;
  }
  function sectionNameOf(id: string) {
    return sections.find((s) => s.id === id)?.name ?? id;
  }

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-50">Teacher Assignments</h1>
        <p className="text-sm text-gray-500">
          Set up an academic session first on the Academics page before assigning teachers.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Teacher Assignments</h1>
        <select className="input max-w-xs" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <PermissionGate code="academics.manage">
        <section className="mb-8 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Assign Class Teacher</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <select className="input" value={ctClassId} onChange={(e) => { setCtClassId(e.target.value); setCtSectionId(''); }}>
              <option value="">Class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input" value={ctSectionId} onChange={(e) => setCtSectionId(e.target.value)} disabled={!ctClassId}>
              <option value="">Section…</option>
              {sections.filter((s) => s.classId === ctClassId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={ctTeacherId} onChange={(e) => setCtTeacherId(e.target.value)}>
              <option value="">Teacher…</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
            <button onClick={handleAssignClassTeacher} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Assign
            </button>
          </div>
        </section>
      </PermissionGate>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Class Teachers</h2>
        {classTeacherAssignments.length === 0 ? (
          <p className="text-sm text-gray-500">No class teachers assigned yet for this session.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            {classTeacherAssignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-3 py-2">
                <span>{classNameOf(a.classId)} - {sectionNameOf(a.sectionId)}</span>
                <span className="font-medium text-gray-900 dark:text-gray-50">{a.teacherName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PermissionGate code="academics.manage">
        <section className="mb-8 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Assign Subject Teacher</h2>
          <div className="flex flex-wrap gap-2">
            <select className="input" value={stClassId} onChange={(e) => { setStClassId(e.target.value); setStSectionId(''); }}>
              <option value="">Class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input" value={stSectionId} onChange={(e) => setStSectionId(e.target.value)} disabled={!stClassId}>
              <option value="">Section…</option>
              {sections.filter((s) => s.classId === stClassId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={stSubjectId} onChange={(e) => setStSubjectId(e.target.value)}>
              <option value="">Subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={stTeacherId} onChange={(e) => setStTeacherId(e.target.value)}>
              <option value="">Teacher…</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
            <button onClick={handleAssignSubjectTeacher} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Assign
            </button>
          </div>
        </section>
      </PermissionGate>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Subject Teachers</h2>
        {subjectTeacherAssignments.length === 0 ? (
          <p className="text-sm text-gray-500">No subject teachers assigned yet for this session.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            {subjectTeacherAssignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-3 py-2">
                <span>{classNameOf(a.classId)} - {sectionNameOf(a.sectionId)} · {a.subjectName}</span>
                <span className="font-medium text-gray-900 dark:text-gray-50">{a.teacherName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
