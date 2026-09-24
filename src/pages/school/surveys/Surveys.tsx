import { useEffect, useState } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses } from '@/services/academics.service';
import type { ClassEntity } from '@/types/academics';
import {
  listSurveys,
  createSurvey,
  deleteSurvey,
  setSurveyActive,
  getSurveyResults,
} from '@/services/surveys.service';
import type { Survey, SurveyResults, SurveyQuestionType } from '@/services/surveys.service';
import { Collapsible } from '@/components/shared/Collapsible';
import { PageHeader } from '@/components/shared/PageHeader';

function SurveyRow({ survey, onDeleted, onToggled }: { survey: Survey; onDeleted: () => void; onToggled: () => void }) {
  const [results, setResults] = useState<SurveyResults[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getSurveyResults(survey.id)
      .then(setResults)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load results.')));
  }, [survey.id]);

  async function handleDelete() {
    try {
      await deleteSurvey(survey.id);
      onDeleted();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to delete survey.'));
    }
  }

  async function handleToggle() {
    try {
      await setSurveyActive(survey.id, !survey.isActive);
      onToggled();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update survey.'));
    }
  }

  const totalResponses = results?.reduce((max, r) => Math.max(max, r.ratingCount, r.textResponses.length), 0) ?? 0;

  return (
    <li className="card p-3 text-sm">
      <Collapsible
        summary={
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-primary-900 dark:text-gray-50">{survey.title}</p>
              <p className="text-xs text-gray-500">
                {survey.targetType === 'all_parents' ? 'All parents' : `Parents of ${survey.targetClassName ?? 'a class'}`} · {totalResponses} response{totalResponses === 1 ? '' : 's'}
              </p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${survey.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
              {survey.isActive ? 'Active' : 'Closed'}
            </span>
          </div>
        }
      >
        {errorMsg && <p className="mb-2 text-xs text-red-600">{errorMsg}</p>}
        {survey.description && <p className="mb-3 text-gray-600 dark:text-gray-400">{survey.description}</p>}

        {results && results.length > 0 && (
          <div className="mb-3 space-y-3">
            {results.map((r) => (
              <div key={r.question.id} className="rounded-md bg-gray-50 p-2.5 dark:bg-gray-900">
                <p className="mb-1 text-xs font-medium text-gray-900 dark:text-gray-50">{r.question.questionText}</p>
                {r.question.questionType === 'rating' ? (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {r.averageRating != null ? `Average ${r.averageRating} / 5 (${r.ratingCount} response${r.ratingCount === 1 ? '' : 's'})` : 'No responses yet'}
                  </p>
                ) : r.textResponses.length > 0 ? (
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {r.textResponses.map((t, i) => (
                      <li key={i}>· {t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400">No responses yet</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={handleToggle} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            {survey.isActive ? 'Close survey' : 'Reopen survey'}
          </button>
          <button onClick={handleDelete} className="flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </Collapsible>
    </li>
  );
}

export function SurveysPage() {
  const { profile } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<'all_parents' | 'class'>('all_parents');
  const [targetClassId, setTargetClassId] = useState('');
  const [questions, setQuestions] = useState<{ text: string; type: SurveyQuestionType }[]>([{ text: '', type: 'rating' }]);

  async function load() {
    if (!profile?.schoolId) return;
    try {
      const [s, c] = await Promise.all([listSurveys(profile.schoolId), listClasses(profile.schoolId)]);
      setSurveys(s);
      setClasses(c);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load surveys.'));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  function updateQuestion(i: number, patch: Partial<{ text: string; type: SurveyQuestionType }>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  async function handleCreate() {
    if (!profile?.schoolId || !title.trim() || questions.some((q) => !q.text.trim())) {
      setErrorMsg('Please fill in a title and every question.');
      return;
    }
    if (targetType === 'class' && !targetClassId) {
      setErrorMsg('Please pick a class.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createSurvey({
        schoolId: profile.schoolId,
        title,
        description,
        targetType,
        targetClassId: targetType === 'class' ? targetClassId : null,
        questions,
      });
      setTitle('');
      setDescription('');
      setTargetType('all_parents');
      setTargetClassId('');
      setQuestions([{ text: '', type: 'rating' }]);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to create survey.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FeatureGate feature="surveys">
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Parent Feedback Surveys" subtitle="Ask parents for feedback and see aggregated results here." />
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <PermissionGate code="surveys.manage">
        <section className="mb-8 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Create survey</h2>

          <input className="input mb-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input mb-3" rows={2} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="mb-3 flex gap-2">
            <select className="input" value={targetType} onChange={(e) => setTargetType(e.target.value as 'all_parents' | 'class')}>
              <option value="all_parents">All parents</option>
              <option value="class">Parents of a specific class</option>
            </select>
            {targetType === 'class' && (
              <select className="input flex-1" value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)}>
                <option value="">Class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Questions</p>
          <div className="mb-3 space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  placeholder={`Question ${i + 1}`}
                  value={q.text}
                  onChange={(e) => updateQuestion(i, { text: e.target.value })}
                />
                <select className="input w-32" value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value as SurveyQuestionType })}>
                  <option value="rating">Rating (1-5)</option>
                  <option value="text">Text answer</option>
                </select>
                {questions.length > 1 && (
                  <button onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-600" aria-label="Remove question">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setQuestions((prev) => [...prev, { text: '', type: 'rating' }])}
            className="mb-4 flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
          >
            <Plus size={12} /> Add question
          </button>

          <button onClick={handleCreate} disabled={submitting} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
            {submitting ? 'Creating…' : 'Create survey'}
          </button>
        </section>
      </PermissionGate>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">All surveys</h2>
        {surveys.length === 0 ? (
          <p className="text-sm text-gray-500">No surveys yet.</p>
        ) : (
          <ul className="space-y-2">
            {surveys.map((s) => (
              <SurveyRow key={s.id} survey={s} onDeleted={load} onToggled={load} />
            ))}
          </ul>
        )}
      </section>
    </div>
    </FeatureGate>
  );
}
