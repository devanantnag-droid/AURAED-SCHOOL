import { supabase } from '@/lib/supabase';

export type GrievanceCategory = 'teacher_conduct' | 'bullying' | 'facility' | 'academic' | 'other';
export type GrievanceStatus = 'open' | 'under_review' | 'resolved' | 'closed';

export interface Grievance {
  id: string;
  studentId: string;
  studentName?: string;
  raisedBy: string | null;
  againstTeacherId: string | null;
  againstTeacherName?: string;
  subject: string;
  description: string;
  category: GrievanceCategory;
  status: GrievanceStatus;
  createdAt: string;
}

export interface GrievanceReply {
  id: string;
  grievanceId: string;
  senderId: string | null;
  senderName?: string;
  body: string;
  createdAt: string;
}

export const GRIEVANCE_CATEGORIES: { value: GrievanceCategory; label: string }[] = [
  { value: 'teacher_conduct', label: 'Teacher conduct' },
  { value: 'bullying', label: 'Bullying' },
  { value: 'facility', label: 'Facility / infrastructure' },
  { value: 'academic', label: 'Academic' },
  { value: 'other', label: 'Other' },
];

export const GRIEVANCE_STATUSES: GrievanceStatus[] = ['open', 'under_review', 'resolved', 'closed'];

async function resolveNames(userIds: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((id): id is string => !!id))];
  if (ids.length === 0) return new Map();
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
  return new Map((data ?? []).map((p) => [p.id, p.full_name]));
}

// schoolId omitted → viewer sees only their own raised grievances (RLS).
// schoolId provided → School Admin's full queue for their school.
export async function listGrievances(schoolId?: string): Promise<Grievance[]> {
  let query = supabase
    .from('grievances')
    .select('*, students(first_name, last_name), teachers(full_name)')
    .order('created_at', { ascending: false });
  if (schoolId) query = query.eq('school_id', schoolId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    studentId: r.student_id,
    studentName: r.students ? `${r.students.first_name} ${r.students.last_name}` : undefined,
    raisedBy: r.raised_by,
    againstTeacherId: r.against_teacher_id,
    againstTeacherName: r.teachers?.full_name,
    subject: r.subject,
    description: r.description,
    category: r.category,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function createGrievance(input: {
  schoolId: string;
  studentId: string;
  subject: string;
  description: string;
  category: GrievanceCategory;
  againstTeacherId?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('grievances').insert({
    school_id: input.schoolId,
    student_id: input.studentId,
    raised_by: user?.id ?? null,
    against_teacher_id: input.againstTeacherId || null,
    subject: input.subject,
    description: input.description,
    category: input.category,
  });
  if (error) throw error;
}

export async function updateGrievanceStatus(id: string, status: GrievanceStatus): Promise<void> {
  const { error } = await supabase.from('grievances').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function listGrievanceReplies(grievanceId: string): Promise<GrievanceReply[]> {
  const { data, error } = await supabase
    .from('grievance_replies')
    .select('*')
    .eq('grievance_id', grievanceId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  const namesById = await resolveNames(rows.map((r) => r.sender_id));

  return rows.map((r) => ({
    id: r.id,
    grievanceId: r.grievance_id,
    senderId: r.sender_id,
    senderName: r.sender_id ? namesById.get(r.sender_id) : undefined,
    body: r.body,
    createdAt: r.created_at,
  }));
}

export async function addGrievanceReply(grievanceId: string, body: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('grievance_replies').insert({
    grievance_id: grievanceId,
    sender_id: user?.id ?? null,
    body,
  });
  if (error) throw error;
}
