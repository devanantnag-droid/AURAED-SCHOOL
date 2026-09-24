import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { listMyActiveSurveys, getSurveyQuestions, getMyResponses, submitResponses } from '@/services/surveys.service';
import type { Survey, SurveyQuestion } from '@/services/surveys.service';

function SurveyCard({ survey }: { survey: Survey }) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { rating?: number; text?: string }>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getSurveyQuestions(survey.id), getMyResponses(survey.id)])
      .then(([qs, responses]) => {
        setQuestions(qs);
        setAnswered(responses.length > 0);
      })
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load this survey.')));
  }, [survey.id]);

  async function handleSubmit() {
    if (questions.some((q) => !answers[q.id]?.rating && !answers[q.id]?.text?.trim())) {
      setErrorMsg('Please answer every question.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await submitResponses(
        survey.id,
        questions.map((q) => ({ questionId: q.id, ratingValue: answers[q.id]?.rating, textValue: answers[q.id]?.text }))
      );
      setAnswered(true);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to submit your response.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
      <p className="font-medium text-gray-900 dark:text-gray-50">{survey.title}</p>
      {survey.description && <p className="mb-3 text-sm text-gray-500">{survey.description}</p>}

      {errorMsg && <p className="mb-3 text-xs text-red-600">{errorMsg}</p>}

      {answered ? (
        <p className="text-sm text-green-700 dark:text-green-400">Thanks — your response has been recorded.</p>
      ) : (
        <>
          <div className="mb-3 space-y-3">
            {questions.map((q) => (
              <div key={q.id}>
                <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">{q.questionText}</p>
                {q.questionType === 'rating' ? (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: { rating: n } }))}
                        className={`h-8 w-8 rounded-full text-sm font-medium ${
                          answers[q.id]?.rating === n ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="input w-full"
                    rows={2}
                    value={answers[q.id]?.text ?? ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { text: e.target.value } }))}
                  />
                )}
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={submitting} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit response'}
          </button>
        </>
      )}
    </div>
  );
}

export function ParentSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyActiveSurveys()
      .then(setSurveys)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load surveys.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (errorMsg) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>;
  if (surveys.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
        <MessageSquare size={28} />
        <p className="text-sm">No surveys right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {surveys.map((s) => (
        <SurveyCard key={s.id} survey={s} />
      ))}
    </div>
  );
}
