import { supabase } from '@/lib/supabase';
import { createStudent } from '@/services/students.service';
import type { Admission, AdmissionDocument, AdmissionStatus } from '@/types/admissions';

function mapRow(r: any): Admission {
  return {
    id: r.id,
    applicantFirstName: r.applicant_first_name,
    applicantLastName: r.applicant_last_name,
    dateOfBirth: r.date_of_birth,
    gender: r.gender,
    parentName: r.parent_name,
    parentPhone: r.parent_phone,
    parentEmail: r.parent_email,
    applyingForClassId: r.applying_for_class_id,
    className: r.classes?.name,
    status: r.status,
    interviewDate: r.interview_date,
    interviewNotes: r.interview_notes,
    remarks: r.remarks,
    convertedStudentId: r.converted_student_id,
  };
}

export async function listAdmissions(schoolId: string): Promise<Admission[]> {
  const { data, error } = await supabase
    .from('admissions')
    .select('*, classes(name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createAdmission(input: {
  schoolId: string;
  sessionId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  applyingForClassId?: string;
}): Promise<void> {
  const { error } = await supabase.from('admissions').insert({
    school_id: input.schoolId,
    academic_session_id: input.sessionId || null,
    applicant_first_name: input.firstName,
    applicant_last_name: input.lastName,
    date_of_birth: input.dateOfBirth || null,
    gender: input.gender || null,
    parent_name: input.parentName || null,
    parent_phone: input.parentPhone || null,
    parent_email: input.parentEmail || null,
    applying_for_class_id: input.applyingForClassId || null,
  });
  if (error) throw error;
}

export async function setAdmissionStatus(id: string, status: AdmissionStatus): Promise<void> {
  const { error } = await supabase.from('admissions').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function scheduleInterview(id: string, interviewDate: string, notes?: string): Promise<void> {
  const { error } = await supabase
    .from('admissions')
    .update({ interview_date: interviewDate, interview_notes: notes || null })
    .eq('id', id);
  if (error) throw error;
}

// Converts an approved applicant into a real student record. This is the
// one place admissions data becomes a student — done deliberately by the
// admin, never automatic, and the admission row keeps a link
// (converted_student_id) back to the resulting student so the pipeline
// history stays intact.
export async function admitApplicant(schoolId: string, admission: Admission): Promise<string> {
  const student = await createStudent(schoolId, {
    admissionNumber: `ADM-${Date.now().toString().slice(-6)}`,
    firstName: admission.applicantFirstName,
    lastName: admission.applicantLastName,
    dateOfBirth: admission.dateOfBirth || undefined,
    gender: admission.gender || undefined,
    classId: admission.applyingForClassId,
  });

  const { error } = await supabase
    .from('admissions')
    .update({ status: 'admitted', converted_student_id: student.id })
    .eq('id', admission.id);
  if (error) throw error;

  return student.id;
}

export async function listDocuments(admissionId: string): Promise<AdmissionDocument[]> {
  const { data, error } = await supabase
    .from('admission_documents')
    .select('*')
    .eq('admission_id', admissionId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    admissionId: r.admission_id,
    filePath: r.file_path,
    fileName: r.file_name,
    uploadedAt: r.uploaded_at,
  }));
}

export async function uploadDocument(schoolId: string, admissionId: string, file: File): Promise<void> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${schoolId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('admissions').upload(path, file);
  if (uploadError) throw uploadError;

  const { error } = await supabase.from('admission_documents').insert({
    school_id: schoolId,
    admission_id: admissionId,
    file_path: path,
    file_name: file.name,
  });
  if (error) throw error;
}

export async function getSignedDocumentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('admissions').createSignedUrl(path, 60 * 5);
  if (error) throw error;
  return data.signedUrl;
}
