import { supabase } from '@/lib/supabase';
import type { Exam, ExamSubject, ExamType, Mark } from '@/types/exams';

export async function listExams(schoolId: string): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('school_id', schoolId)
    .order('start_date', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    examType: r.exam_type,
    startDate: r.start_date,
    endDate: r.end_date,
  }));
}

export async function createExam(input: {
  schoolId: string;
  sessionId: string;
  name: string;
  examType: ExamType;
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  const { error } = await supabase.from('exams').insert({
    school_id: input.schoolId,
    academic_session_id: input.sessionId,
    name: input.name,
    exam_type: input.examType,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
  });
  if (error) throw error;
}

function mapExamSubjectRow(r: any): ExamSubject {
  return {
    id: r.id,
    examId: r.exam_id,
    classId: r.class_id,
    sectionId: r.section_id,
    subjectId: r.subject_id,
    examDate: r.exam_date,
    maxMarks: Number(r.max_marks),
    passingMarks: Number(r.passing_marks),
    room: r.room,
    isFinalized: r.is_finalized,
    className: r.classes?.name,
    sectionName: r.sections?.name,
    subjectName: r.subjects?.name,
  };
}

export async function listExamSubjects(schoolId: string, examId: string): Promise<ExamSubject[]> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('*, classes(name), sections(name), subjects(name)')
    .eq('school_id', schoolId)
    .eq('exam_id', examId);
  if (error) throw error;
  return (data ?? []).map(mapExamSubjectRow);
}

export async function createExamSubject(input: {
  schoolId: string;
  examId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  examDate?: string;
  maxMarks: number;
  passingMarks: number;
  room?: string;
}): Promise<void> {
  const { error } = await supabase.from('exam_subjects').insert({
    school_id: input.schoolId,
    exam_id: input.examId,
    class_id: input.classId,
    section_id: input.sectionId,
    subject_id: input.subjectId,
    exam_date: input.examDate || null,
    max_marks: input.maxMarks,
    passing_marks: input.passingMarks,
    room: input.room || null,
  });
  if (error) throw error;
}

export async function setExamSubjectFinalized(id: string, isFinalized: boolean): Promise<void> {
  const { error } = await supabase.from('exam_subjects').update({ is_finalized: isFinalized }).eq('id', id);
  if (error) throw error;
}

export async function listMarksForExamSubject(examSubjectId: string): Promise<Mark[]> {
  const { data, error } = await supabase
    .from('marks')
    .select('*, students(first_name, last_name)')
    .eq('exam_subject_id', examSubjectId);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    examSubjectId: r.exam_subject_id,
    studentId: r.student_id,
    marksObtained: r.marks_obtained !== null ? Number(r.marks_obtained) : null,
    grade: r.grade,
    remarks: r.remarks,
    studentName: r.students ? `${r.students.first_name} ${r.students.last_name}` : undefined,
  }));
}

// Ensures a mark row exists for every active student in the exam
// subject's class/section, so entry always starts from a complete roster.
export async function ensureMarkRows(schoolId: string, examSubject: ExamSubject): Promise<void> {
  const { data: students, error } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', schoolId)
    .eq('class_id', examSubject.classId)
    .eq('section_id', examSubject.sectionId)
    .eq('status', 'active');
  if (error) throw error;
  if (!students || students.length === 0) return;

  const { error: upsertError } = await supabase.from('marks').upsert(
    students.map((s) => ({ school_id: schoolId, exam_subject_id: examSubject.id, student_id: s.id })),
    { onConflict: 'exam_subject_id,student_id', ignoreDuplicates: true }
  );
  if (upsertError) throw upsertError;
}

export async function saveMark(id: string, marksObtained: number, remarks?: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('marks')
    .update({ marks_obtained: marksObtained, remarks: remarks || null, entered_by: user?.id ?? null })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Report card data ----------

export interface ReportCardRow {
  subjectName: string;
  marksObtained: number | null;
  maxMarks: number;
  passingMarks: number;
}

export async function getReportCardData(examId: string, studentId: string, classId: string, sectionId: string) {
  const { data: examSubjects, error } = await supabase
    .from('exam_subjects')
    .select('id, max_marks, passing_marks, subjects(name)')
    .eq('exam_id', examId)
    .eq('class_id', classId)
    .eq('section_id', sectionId);
  if (error) throw error;

  const examSubjectIds = (examSubjects ?? []).map((es) => es.id);
  if (examSubjectIds.length === 0) return [];

  const { data: marks, error: marksError } = await supabase
    .from('marks')
    .select('exam_subject_id, marks_obtained')
    .eq('student_id', studentId)
    .in('exam_subject_id', examSubjectIds);
  if (marksError) throw marksError;

  const marksByExamSubject = new Map((marks ?? []).map((m) => [m.exam_subject_id, m.marks_obtained]));

  return (examSubjects ?? []).map((es) => ({
    subjectName: (es as unknown as { subjects: { name: string } }).subjects?.name ?? '',
    marksObtained: marksByExamSubject.get(es.id) !== undefined ? Number(marksByExamSubject.get(es.id)) : null,
    maxMarks: Number(es.max_marks),
    passingMarks: Number(es.passing_marks),
  })) as ReportCardRow[];
}
