import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import {
  ensureMarkRows,
  listExamSubjects,
  listExams,
  listMarksForExamSubject,
  saveMark,
  setExamSubjectFinalized,
} from '@/services/exams.service';
import type { Exam, ExamSubject, Mark } from '@/types/exams';

function MarksInner() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState('');
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [examSubjectId, setExamSubjectId] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { marks: string; remarks: string }>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = examSubjects.find((es) => es.id === examSubjectId) ?? null;

  useEffect(() => {
    if (!profile?.schoolId) return;
    listExams(profile.schoolId).then((ex) => {
      setExams(ex);
      if (ex.length > 0) setExamId(ex[0].id);
    });
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !examId) return;
    listExamSubjects(profile.schoolId, examId).then((es) => {
      setExamSubjects(es);
      setExamSubjectId(es.length > 0 ? es[0].id : '');
    });
  }, [profile?.schoolId, examId]);

  useEffect(() => {
    if (!profile?.schoolId || !selected) return;
    setLoading(true);
    setErrorMsg(null);
    // Once finalized, don't attempt to create/ensure roster rows — that
    // write is correctly blocked for non-admins by the lock trigger, but
    // it has nothing to do with just viewing the already-entered marks.
    const ensureStep = selected.isFinalized
      ? Promise.resolve()
      : ensureMarkRows(profile.schoolId, selected);

    ensureStep
      .then(() => listMarksForExamSubject(selected.id))
      .then(setMarks)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load marks.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId, examSubjectId]);

  async function handleSave(markId: string) {
    const draft = drafts[markId];
    if (!draft?.marks) return;
    setErrorMsg(null);
    try {
      await saveMark(markId, Number(draft.marks), draft.remarks);
      if (selected) setMarks(await listMarksForExamSubject(selected.id));
      setSavedIds((prev) => new Set(prev).add(markId));
      setTimeout(() => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(markId);
          return next;
        });
      }, 2000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to save mark.'));
    }
  }

  async function handleToggleFinalize() {
    if (!selected) return;
    setErrorMsg(null);
    try {
      await setExamSubjectFinalized(selected.id, !selected.isFinalized);
      if (profile?.schoolId) setExamSubjects(await listExamSubjects(profile.schoolId, examId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update lock status.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-50">Marks Entry</h1>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      {exams.length === 0 ? (
        <p className="text-sm text-gray-500">No exams set up yet — create one on the Exams page first.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select className="input" value={examSubjectId} onChange={(e) => setExamSubjectId(e.target.value)}>
              {examSubjects.map((es) => (
                <option key={es.id} value={es.id}>
                  {es.className} - {es.sectionName} · {es.subjectName}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="mb-4 flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
              <span>
                Max marks: <strong>{selected.maxMarks}</strong> · Passing: <strong>{selected.passingMarks}</strong>
              </span>
              <PermissionGate code="marks.finalize">
                <button
                  onClick={handleToggleFinalize}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    selected.isFinalized
                      ? 'border border-green-300 text-green-700 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950'
                      : 'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950'
                  }`}
                >
                  {selected.isFinalized ? 'Unlock results' : 'Finalize & lock results'}
                </button>
              </PermissionGate>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : marks.length === 0 ? (
            <p className="text-sm text-gray-500">No active students in this class/section.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              {marks.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-40 truncate font-medium text-gray-900 dark:text-gray-50">{m.studentName}</span>
                  <input
                    type="number"
                    className="input w-24 py-1"
                    placeholder="Marks"
                    defaultValue={m.marksObtained ?? ''}
                    disabled={selected?.isFinalized}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [m.id]: { marks: e.target.value, remarks: prev[m.id]?.remarks ?? m.remarks ?? '' },
                      }))
                    }
                  />
                  <input
                    className="input flex-1 py-1"
                    placeholder="Remarks (optional)"
                    defaultValue={m.remarks ?? ''}
                    disabled={selected?.isFinalized}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [m.id]: { marks: prev[m.id]?.marks ?? String(m.marksObtained ?? ''), remarks: e.target.value },
                      }))
                    }
                  />
                  <PermissionGate code="marks.enter">
                    <button
                      onClick={() => handleSave(m.id)}
                      disabled={selected?.isFinalized}
                      className={`rounded-md px-3 py-1.5 text-white disabled:opacity-50 ${
                        savedIds.has(m.id) ? 'bg-green-600' : 'bg-primary-600 hover:bg-primary-700'
                      }`}
                    >
                      {savedIds.has(m.id) ? 'Saved ✓' : 'Save'}
                    </button>
                  </PermissionGate>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export function MarksPage() {
  return (
    <FeatureGate feature="results">
      <MarksInner />
    </FeatureGate>
  );
}
