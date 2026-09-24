export interface Homework {
  id: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  attachmentPath: string | null;
  isPublished: boolean;
  createdAt: string;
  className?: string;
  sectionName?: string;
  subjectName?: string;
  teacherName?: string;
}

export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'graded';

export interface Assignment {
  id: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  maxMarks: number | null;
  attachmentPath: string | null;
  isPublished: boolean;
  createdAt: string;
  className?: string;
  sectionName?: string;
  subjectName?: string;
  teacherName?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submittedAt: string | null;
  attachmentPath: string | null;
  status: SubmissionStatus;
  marksObtained: number | null;
  feedback: string | null;
}

export interface StudyMaterial {
  id: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string | null;
  filePath: string | null;
  fileType: string | null;
  createdAt: string;
  className?: string;
  sectionName?: string;
  subjectName?: string;
}
