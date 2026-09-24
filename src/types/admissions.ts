export type AdmissionStatus = 'enquiry' | 'applied' | 'under_review' | 'approved' | 'rejected' | 'admitted';

export interface Admission {
  id: string;
  applicantFirstName: string;
  applicantLastName: string;
  dateOfBirth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  applyingForClassId: string | null;
  className?: string;
  status: AdmissionStatus;
  interviewDate: string | null;
  interviewNotes: string | null;
  remarks: string | null;
  convertedStudentId: string | null;
}

export interface AdmissionDocument {
  id: string;
  admissionId: string;
  filePath: string;
  fileName: string;
  uploadedAt: string;
}

export const ADMISSION_STATUSES: AdmissionStatus[] = [
  'enquiry', 'applied', 'under_review', 'approved', 'rejected', 'admitted',
];
