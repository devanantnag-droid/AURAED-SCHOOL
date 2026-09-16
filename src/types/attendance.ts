export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'holiday';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks: string | null;
}

export interface ClassSection {
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
}
