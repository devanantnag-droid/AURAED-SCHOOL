import { supabase } from '@/lib/supabase';

export type LeaveType = 'sick' | 'casual' | 'emergency' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type RequesterType = 'teacher' | 'student';

export interface LeaveRequest {
  id: string;
  requesterType: RequesterType;
  requesterName?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewNotes: string | null;
  createdAt: string;
}

export const LEAVE_TYPES: LeaveType[] = ['sick', 'casual', 'emergency', 'other'];

// schoolId provided → School Admin's full queue. Omitted → RLS returns
// only the caller's own requests.
export async function listLeaveRequests(schoolId?: string): Promise<LeaveRequest[]> {
  let query = supabase
    .from('leave_requests')
    .select('*, teachers(full_name), students(first_name, last_name)')
    .order('created_at', { ascending: false });
  if (schoolId) query = query.eq('school_id', schoolId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    requesterType: r.requester_type,
    requesterName: r.teachers?.full_name ?? (r.students ? `${r.students.first_name} ${r.students.last_name}` : undefined),
    leaveType: r.leave_type,
    startDate: r.start_date,
    endDate: r.end_date,
    reason: r.reason,
    status: r.status,
    reviewNotes: r.review_notes,
    createdAt: r.created_at,
  }));
}

export async function createLeaveRequest(input: {
  schoolId: string;
  requesterType: RequesterType;
  teacherId?: string;
  studentId?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('leave_requests').insert({
    school_id: input.schoolId,
    requester_type: input.requesterType,
    teacher_id: input.teacherId ?? null,
    student_id: input.studentId ?? null,
    requested_by: user?.id ?? null,
    leave_type: input.leaveType,
    start_date: input.startDate,
    end_date: input.endDate,
    reason: input.reason,
  });
  if (error) throw error;
}

export async function reviewLeaveRequest(id: string, status: 'approved' | 'rejected', reviewNotes?: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status,
      review_notes: reviewNotes || null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}
