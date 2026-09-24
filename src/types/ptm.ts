export interface PtmSession {
  id: string;
  title: string;
  ptmDate: string;
}

export interface PtmSlot {
  id: string;
  ptmSessionId: string;
  teacherId: string;
  teacherName?: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface PtmBooking {
  id: string;
  ptmSlotId: string;
  studentId: string;
  studentName?: string;
  teacherName?: string;
  startTime?: string;
  endTime?: string;
  parentName: string;
  parentPhone: string | null;
  notes: string | null;
}
