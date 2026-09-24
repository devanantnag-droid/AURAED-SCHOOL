import { supabase } from '@/lib/supabase';

export type SurveyTargetType = 'all_parents' | 'class';
export type SurveyQuestionType = 'rating' | 'text';

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  targetType: SurveyTargetType;
  targetClassId: string | null;
  targetClassName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  questionText: string;
  questionType: SurveyQuestionType;
  displayOrder: number;
}

export interface SurveyResponse {
  id: string;
  questionId: string;
  respondentId: string;
  ratingValue: number | null;
  textValue: string | null;
}

export async function listSurveys(schoolId: string): Promise<Survey[]> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*, classes(name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    targetType: r.target_type as SurveyTargetType,
    targetClassId: r.target_class_id,
    targetClassName: (r as unknown as { classes: { name: string } | null }).classes?.name,
    isActive: r.is_active,
    createdAt: r.created_at,
  }));
}

// Parents rely on RLS to only ever see surveys actually targeted at
// them (all_parents, or their own child's class) — no extra filtering
// needed client-side.
export async function listMyActiveSurveys(): Promise<Survey[]> {
  const { data, error } = await supabase.from('surveys').select('*').eq('is_active', true).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    targetType: r.target_type as SurveyTargetType,
    targetClassId: r.target_class_id,
    isActive: r.is_active,
    createdAt: r.created_at,
  }));
}

export async function getSurveyQuestions(surveyId: string): Promise<SurveyQuestion[]> {
  const { data, error } = await supabase.from('survey_questions').select('*').eq('survey_id', surveyId).order('display_order');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    surveyId: r.survey_id,
    questionText: r.question_text,
    questionType: r.question_type as SurveyQuestionType,
    displayOrder: r.display_order,
  }));
}

export async function createSurvey(input: {
  schoolId: string;
  title: string;
  description?: string;
  targetType: SurveyTargetType;
  targetClassId?: string | null;
  questions: { text: string; type: SurveyQuestionType }[];
}): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  const { data: survey, error } = await supabase
    .from('surveys')
    .insert({
      school_id: input.schoolId,
      title: input.title,
      description: input.description ?? null,
      target_type: input.targetType,
      target_class_id: input.targetType === 'class' ? input.targetClassId : null,
      created_by: user.user?.id ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;

  if (input.questions.length > 0) {
    const { error: qError } = await supabase.from('survey_questions').insert(
      input.questions.map((q, i) => ({
        survey_id: survey.id,
        question_text: q.text,
        question_type: q.type,
        display_order: i,
      }))
    );
    if (qError) throw qError;
  }
}

export async function deleteSurvey(id: string): Promise<void> {
  const { error } = await supabase.from('surveys').delete().eq('id', id);
  if (error) throw error;
}

export async function setSurveyActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('surveys').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

// A parent's own responses to one survey - used to check whether
// they've already responded, so the form isn't shown twice.
export async function getMyResponses(surveyId: string): Promise<SurveyResponse[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*, survey_questions!inner(survey_id)')
    .eq('respondent_id', user.user.id)
    .eq('survey_questions.survey_id', surveyId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    questionId: r.question_id,
    respondentId: r.respondent_id,
    ratingValue: r.rating_value,
    textValue: r.text_value,
  }));
}

export async function submitResponses(
  surveyId: string,
  answers: { questionId: string; ratingValue?: number; textValue?: string }[]
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not signed in.');
  const { error } = await supabase.from('survey_responses').upsert(
    answers.map((a) => ({
      survey_id: surveyId,
      question_id: a.questionId,
      respondent_id: user.user!.id,
      rating_value: a.ratingValue ?? null,
      text_value: a.textValue ?? null,
    })),
    { onConflict: 'question_id,respondent_id' }
  );
  if (error) throw error;
}

export interface SurveyResults {
  question: SurveyQuestion;
  averageRating: number | null;
  ratingCount: number;
  textResponses: string[];
}

export async function getSurveyResults(surveyId: string): Promise<SurveyResults[]> {
  const [questions, { data: responses, error }] = await Promise.all([
    getSurveyQuestions(surveyId),
    supabase.from('survey_responses').select('*, survey_questions!inner(survey_id)').eq('survey_questions.survey_id', surveyId),
  ]);
  if (error) throw error;

  return questions.map((q) => {
    const forQuestion = (responses ?? []).filter((r) => r.question_id === q.id);
    const ratings = forQuestion.map((r) => r.rating_value).filter((v): v is number => v != null);
    const texts = forQuestion.map((r) => r.text_value).filter((v): v is string => !!v);
    return {
      question: q,
      averageRating: ratings.length > 0 ? Math.round((ratings.reduce((s, v) => s + v, 0) / ratings.length) * 10) / 10 : null,
      ratingCount: ratings.length,
      textResponses: texts,
    };
  });
}
