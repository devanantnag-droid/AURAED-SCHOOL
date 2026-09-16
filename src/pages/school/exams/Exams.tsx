import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses, listSections, listSessions, listSubjects } from '@/services/academics.service';
import { createExam, createExamSubject, listExamSubjects, listExams } from '@/services/exams.service';
import type { AcademicSession, ClassEntity, Section, Subject } from '@/types/academics';
import type { Exam, ExamSubject, ExamType } from '@/types/exams';

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'mid_term', label: 'Mid Term' },
  { value: 'final', label: 'Final' },
  { value: 'monthly_test', label: 'Monthly Test' },
  { value: 'internal_assessment', label: 'Internal Assessment' },
];

function ExamsInner() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState('');
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState<ExamType>('unit_test');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [esClassId, setEsClassId] = useState('');
  const [esSectionId, setEsSectionId] = useState('');
  const [esSubjectId, setEsSubjectId] = useState('');
  const [esMaxMarks, setEsMaxMarks] = useState('100');
  const [esPassingMarks, setEsPassingMarks] = useState('33');
  const [esDate, setEsDate] = useState('');

  async function loadBase() {
    if (!profile?.schoolId) return;
    const [s, c, sub, ex] = await Promise.all([
      listSessions(profile.schoolId),
      listClasses(profile.schoolId),
      listSubjects(profile.schoolId),
      listExams(profile.schoolId),
    ]);
    setSessions(s);
    setClasses(c);
    setSubjects(sub);
    setExams(ex);
    const current = s.find((x) => x.isCurrent) ?? s[0];
    if (current) setSessionId(current.id);
    if (ex.length > 0) setSelectedExamId(ex[0].id);
  }

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !selectedExamId) return;
    listExamSubjects(profile.schoolId, selectedExamId).then(setExamSubjects);
  }, [profile?.schoolId, selectedExamId]);

  useEffect(() => {
    if (!profile?.schoolId || !esClassId) return;
    listSections(profile.schoolId, esClassId).then(setSections);
  }, [profile?.schoolId, esClassId]);

  async function handleCreateExam() {
    if (!profile?.schoolId || !sessionId || !examName.trim()) return;
    setErrorMsg(null);
    try {
      await createExam({ schoolId: profile.schoolId, sessionId, name: examName, examType, startDate, endDate });
      setExamName('');
      setStartDate('');
      setEndDate('');
      const ex = await listExams(profile.schoolId);
      setExams(ex);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to create exam.'));
    }
  }

  async function handleAddExamSubject() {
    if (!profile?.schoolId || !selectedExamId || !esClassId || !esSectionId || !esSubjectId) return;
    setErrorMsg(null);
    try {
      await createExamSubject({
        schoolId: profile.schoolId,
        examId: selectedExamId,
        classId: esClassId,
        sectionId: esSectionId,
        subjectId: esSubjectId,
        examDate: esDate,
        maxMarks: Number(esMaxMarks),
        passingMarks: Number(esPassingMarks),
      });
      setEsSubjectId('');
      setEsDate('');
      setExamSubjects(await listExamSubjects(profile.schoolId, selectedExamId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add exam subject.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-50">Exams</h1>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <PermissionGate code="exams.manage">
        <section className="mb-8 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Create exam</h2>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={examType} onChange={(e) => setExamType(e.target.value as ExamType)}>
              {EXAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Exam name, e.g. Unit Test 1" value={examName} onChange={(e) => setExamName(e.target.value)} />
            <button onClick={handleCreateExam} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Create
            </button>
          </div>
        </section>
      </PermissionGate>

      {exams.length === 0 ? (
        <p className="text-sm text-gray-500">No exams yet.</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">Select exam</label>
            <select className="input max-w-sm" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <PermissionGate code="exams.manage">
            <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Add exam paper</h2>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <select className="input" value={esClassId} onChange={(e) => { setEsClassId(e.target.value); setEsSectionId(''); }}>
                  <option value="">Class…</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="input" value={esSectionId} onChange={(e) => setEsSectionId(e.target.value)} disabled={!esClassId}>
                  <option value="">Section…</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="input" value={esSubjectId} onChange={(e) => setEsSubjectId(e.target.value)}>
                  <option value="">Subject…</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <input type="date" className="input" value={esDate} onChange={(e) => setEsDate(e.target.value)} />
                <input type="number" className="input" placeholder="Max marks" value={esMaxMarks} onChange={(e) => setEsMaxMarks(e.target.value)} />
                <input type="number" className="input" placeholder="Passing marks" value={esPassingMarks} onChange={(e) => setEsPassingMarks(e.target.value)} />
              </div>
              <button onClick={handleAddExamSubject} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Add paper
              </button>
            </section>
          </PermissionGate>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Exam papers</h2>
            {examSubjects.length === 0 ? (
              <p className="text-sm text-gray-500">No papers set up for this exam yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
                {examSubjects.map((es) => (
                  <li key={es.id} className="flex items-center justify-between px-3 py-2">
                    <span>
                      {es.className} - {es.sectionName} · {es.subjectName}
                    </span>
                    <span className="text-gray-500">
                      Max {es.maxMarks} / Pass {es.passingMarks}
                      {es.isFinalized && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">locked</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function ExamsPage() {
  return (
    <FeatureGate feature="exams">
      <ExamsInner />
    </FeatureGate>
  );
}
