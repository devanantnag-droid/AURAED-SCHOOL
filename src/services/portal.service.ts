import { supabase } from '@/lib/supabase';
import { getStudentAttendancePercentage } from '@/services/attendance.service';
import { listStudentFees } from '@/services/fees.service';
import { listHomework } from '@/services/homework.service';
import { listAssignments } from '@/services/assignments.service';
import type { StudentFee } from '@/types/fees';
import type { Homework, Assignment } from '@/types/coursework';

export interface PortalChild {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  className: string | null;
  sectionName: string | null;
  classId: string | null;
  sectionId: string | null;
}

// For a parent — every child linked via parent_students, resolved through
// the my_children() helper added in this phase's foundation migration.
export async function getMyChildren(): Promise<PortalChild[]> {
  const { data: childIds, error: idsError } = await supabase.rpc('my_children');
  if (idsError) throw idsError;
  if (!childIds || childIds.length === 0) return [];

  const { data, error } = await supabase
    .from('students')
    .select('id, first_name, last_name, admission_number, class_id, section_id, classes(name), sections(name)')
    .in('id', childIds);
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    admissionNumber: r.admission_number,
    className: r.classes?.name ?? null,
    sectionName: r.sections?.name ?? null,
    classId: r.class_id,
    sectionId: r.section_id,
  }));
}

export interface RecentMark {
  examName: string;
  subjectName: string;
  marksObtained: number | null;
  maxMarks: number;
}

// Every mark recorded for this student, most recent exam first. Relies
// entirely on this phase's marks_select_self / exam_subjects_select_self
// RLS policies — no school_id filter needed here, since RLS already
// guarantees this call can only ever return this one student's own rows.
async function getRecentMarks(studentId: string): Promise<RecentMark[]> {
  const { data, error } = await supabase
    .from('marks')
    .select('marks_obtained, exam_subjects(max_marks, subjects(name), exams(name, created_at))')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    examName: r.exam_subjects?.exams?.name ?? '',
    subjectName: r.exam_subjects?.subjects?.name ?? '',
    marksObtained: r.marks_obtained !== null ? Number(r.marks_obtained) : null,
    maxMarks: Number(r.exam_subjects?.max_marks ?? 0),
  }));
}

export interface PortalSummary {
  attendancePercentage: number | null;
  fees: StudentFee[];
  homework: Homework[];
  assignments: Assignment[];
  recentMarks: RecentMark[];
}

export async function getPortalSummary(schoolId: string, studentId: string): Promise<PortalSummary> {
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('class_id, section_id')
    .eq('id', studentId)
    .single();
  if (studentError) throw studentError;

  const [attendancePercentage, fees, allHomework, allAssignments, recentMarks] = await Promise.all([
    getStudentAttendancePercentage(studentId),
    listStudentFees(schoolId, studentId),
    listHomework(schoolId),
    listAssignments(schoolId),
    getRecentMarks(studentId),
  ]);

  // listHomework/listAssignments return every class the caller can see —
  // for a parent with more than one child, that's every one of their
  // children's classes combined. Narrow to this specific student's own
  // class/section so viewing one child's dashboard doesn't show a
  // sibling's homework too.
  const homework = allHomework.filter((h) => h.classId === student.class_id && h.sectionId === student.section_id);
  const assignments = allAssignments.filter((a) => a.classId === student.class_id && a.sectionId === student.section_id);

  return { attendancePercentage, fees, homework, assignments, recentMarks };
}
