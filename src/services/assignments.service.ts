import { supabase } from '@/lib/supabase';
import type { Assignment, AssignmentSubmission } from '@/types/coursework';

function mapAssignmentRow(r: any): Assignment {
  return {
    id: r.id,
    classId: r.class_id,
    sectionId: r.section_id,
    subjectId: r.subject_id,
    teacherId: r.teacher_id,
    title: r.title,
    description: r.description,
    dueDate: r.due_date,
    maxMarks: r.max_marks !== null ? Number(r.max_marks) : null,
    attachmentPath: r.attachment_path,
    isPublished: r.is_published,
    createdAt: r.created_at,
    className: r.classes?.name,
    sectionName: r.sections?.name,
    subjectName: r.subjects?.name,
    teacherName: r.teachers?.full_name,
  };
}

export async function listAssignments(schoolId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, classes(name), sections(name), subjects(name), teachers(full_name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAssignmentRow);
}

export async function createAssignment(input: {
  schoolId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxMarks?: number;
  attachmentPath?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('assignments').insert({
    school_id: input.schoolId,
    academic_session_id: input.sessionId,
    class_id: input.classId,
    section_id: input.sectionId,
    subject_id: input.subjectId,
    teacher_id: input.teacherId,
    title: input.title,
    description: input.description || null,
    due_date: input.dueDate || null,
    max_marks: input.maxMarks ?? null,
    attachment_path: input.attachmentPath || null,
  });
  if (error) throw error;
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) throw error;
}

function mapSubmissionRow(r: any): AssignmentSubmission {
  return {
    id: r.id,
    assignmentId: r.assignment_id,
    studentId: r.student_id,
    studentName: r.students ? `${r.students.first_name} ${r.students.last_name}` : undefined,
    submittedAt: r.submitted_at,
    attachmentPath: r.attachment_path,
    status: r.status,
    marksObtained: r.marks_obtained !== null ? Number(r.marks_obtained) : null,
    feedback: r.feedback,
  };
}

// A submission row is created for every enrolled student the first time
// the teacher opens the grading view, so grading always starts from a
// complete roster rather than only students who happened to submit
// something already (there's no student self-submission portal yet).
export async function ensureSubmissionRows(
  schoolId: string,
  assignmentId: string,
  classId: string,
  sectionId: string
): Promise<void> {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('section_id', sectionId)
    .eq('status', 'active');
  if (studentsError) throw studentsError;

  if (!students || students.length === 0) return;

  const { error } = await supabase
    .from('assignment_submissions')
    .upsert(
      students.map((s) => ({ assignment_id: assignmentId, school_id: schoolId, student_id: s.id })),
      { onConflict: 'assignment_id,student_id', ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function listSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*, students(first_name, last_name)')
    .eq('assignment_id', assignmentId);
  if (error) throw error;
  return (data ?? []).map(mapSubmissionRow);
}

export async function gradeSubmission(id: string, marksObtained: number, feedback?: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('assignment_submissions')
    .update({
      marks_obtained: marksObtained,
      feedback: feedback || null,
      status: 'graded',
      graded_at: new Date().toISOString(),
      graded_by: user?.id ?? null,
    })
    .eq('id', id);
  if (error) throw error;
}
