export interface AcademicSession {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}

export interface ClassEntity {
  id: string;
  name: string;
  displayOrder: number;
}

export interface Section {
  id: string;
  classId: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface ClassTeacherAssignment {
  id: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  teacherId: string;
  teacherName?: string;
}

export interface SubjectTeacherAssignment {
  id: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  teacherName?: string;
  subjectName?: string;
}

export interface TimetableEntry {
  id: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number; // 0=Sunday..6=Saturday
  periodNumber: number;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  subjectName?: string;
  teacherName?: string;
  className?: string;
  sectionName?: string;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
