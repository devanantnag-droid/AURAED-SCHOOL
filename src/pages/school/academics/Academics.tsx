import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import {
  createClass,
  createSection,
  createSession,
  createSubject,
  listClasses,
  listSections,
  listSessions,
  listSubjects,
  setCurrentSession,
} from '@/services/academics.service';
import type { AcademicSession, ClassEntity, Section, Subject } from '@/types/academics';

function AcademicsInner() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'sessions' | 'classes' | 'subjects'>('sessions');

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-50">Academics</h1>

      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['sessions', 'classes', 'subjects'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 capitalize ${
              tab === t
                ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400'
                : 'border-transparent text-gray-500'
            }`}
          >
            {t === 'classes' ? 'Classes & Sections' : t}
          </button>
        ))}
      </div>

      {!profile?.schoolId ? null : tab === 'sessions' ? (
        <SessionsTab schoolId={profile.schoolId} />
      ) : tab === 'classes' ? (
        <ClassesTab schoolId={profile.schoolId} />
      ) : (
        <SubjectsTab schoolId={profile.schoolId} />
      )}
    </div>
  );
}

function SessionsTab({ schoolId }: { schoolId: string }) {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setSessions(await listSessions(schoolId));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  async function handleAdd() {
    if (!name.trim()) return;
    setErrorMsg(null);
    try {
      await createSession(schoolId, { name, startDate, endDate });
      setName('');
      setStartDate('');
      setEndDate('');
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add session.'));
    }
  }

  async function handleSetCurrent(id: string) {
    setErrorMsg(null);
    try {
      await setCurrentSession(schoolId, id);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to set current session.'));
    }
  }

  return (
    <div>
      <PermissionGate code="academics.manage">
        <div className="mb-5 flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
            <input className="input" placeholder="e.g. 2026-2027" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Start date</label>
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">End date</label>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button onClick={handleAdd} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Add session
          </button>
        </div>
      </PermissionGate>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">No academic sessions yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-3 py-2.5">
              <span className="font-medium text-gray-900 dark:text-gray-50">
                {s.name}
                {s.startDate && <span className="ml-2 text-xs font-normal text-gray-500">{s.startDate} → {s.endDate ?? '—'}</span>}
              </span>
              {s.isCurrent ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                  Current
                </span>
              ) : (
                <PermissionGate code="academics.manage">
                  <button onClick={() => handleSetCurrent(s.id)} className="text-xs text-primary-600 hover:underline">
                    Set as current
                  </button>
                </PermissionGate>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClassesTab({ schoolId }: { schoolId: string }) {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newSectionByClass, setNewSectionByClass] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    const [c, s] = await Promise.all([listClasses(schoolId), listSections(schoolId)]);
    setClasses(c);
    setSections(s);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  async function handleAddClass() {
    if (!newClassName.trim()) return;
    setErrorMsg(null);
    try {
      await createClass(schoolId, newClassName);
      setNewClassName('');
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add class.'));
    }
  }

  async function handleAddSection(classId: string) {
    const name = newSectionByClass[classId];
    if (!name?.trim()) return;
    setErrorMsg(null);
    try {
      await createSection(schoolId, classId, name);
      setNewSectionByClass((prev) => ({ ...prev, [classId]: '' }));
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add section.'));
    }
  }

  return (
    <div>
      <PermissionGate code="academics.manage">
        <div className="mb-5 flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">New class name</label>
            <input className="input" placeholder="e.g. 10" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
          </div>
          <button onClick={handleAddClass} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Add class
          </button>
        </div>
      </PermissionGate>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      {classes.length === 0 ? (
        <p className="text-sm text-gray-500">No classes yet.</p>
      ) : (
        <div className="space-y-4">
          {classes.map((c) => (
            <div key={c.id} className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
              <p className="mb-2 font-medium text-gray-900 dark:text-gray-50">Class {c.name}</p>
              <div className="mb-2 flex flex-wrap gap-2">
                {sections
                  .filter((s) => s.classId === c.id)
                  .map((s) => (
                    <span key={s.id} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      Section {s.name}
                    </span>
                  ))}
                {sections.filter((s) => s.classId === c.id).length === 0 && (
                  <span className="text-xs text-gray-500">No sections yet.</span>
                )}
              </div>
              <PermissionGate code="academics.manage">
                <div className="flex gap-2">
                  <input
                    className="input max-w-[140px] text-sm"
                    placeholder="e.g. A"
                    value={newSectionByClass[c.id] ?? ''}
                    onChange={(e) => setNewSectionByClass((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => handleAddSection(c.id)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    Add section
                  </button>
                </div>
              </PermissionGate>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectsTab({ schoolId }: { schoolId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setSubjects(await listSubjects(schoolId));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  async function handleAdd() {
    if (!name.trim() || !code.trim()) return;
    setErrorMsg(null);
    try {
      await createSubject(schoolId, name, code);
      setName('');
      setCode('');
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add subject.'));
    }
  }

  return (
    <div>
      <PermissionGate code="academics.manage">
        <div className="mb-5 flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Subject name</label>
            <input className="input" placeholder="e.g. Mathematics" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Code</label>
            <input className="input max-w-[100px]" placeholder="e.g. MATH" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <button onClick={handleAdd} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Add subject
          </button>
        </div>
      </PermissionGate>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      {subjects.length === 0 ? (
        <p className="text-sm text-gray-500">No subjects yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
          {subjects.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-3 py-2">
              <span className="font-medium text-gray-900 dark:text-gray-50">{s.name}</span>
              <code className="text-xs text-gray-500">{s.code}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AcademicsPage() {
  return <AcademicsInner />;
}
