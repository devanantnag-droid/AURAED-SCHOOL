export type ExamType = 'unit_test' | 'mid_term' | 'final' | 'monthly_test' | 'internal_assessment';

export interface Exam {
  id: string;
  name: string;
  examType: ExamType;
  startDate: string | null;
  endDate: string | null;
}

export interface ExamSubject {
  id: string;
  examId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  examDate: string | null;
  maxMarks: number;
  passingMarks: number;
  room: string | null;
  isFinalized: boolean;
  className?: string;
  sectionName?: string;
  subjectName?: string;
}

export interface Mark {
  id: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number | null;
  grade: string | null;
  remarks: string | null;
  studentName?: string;
}
