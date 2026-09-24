import { supabase } from '@/lib/supabase';
import type { PtmBooking, PtmSession, PtmSlot } from '@/types/ptm';

export async function listSessions(schoolId: string): Promise<PtmSession[]> {
  const { data, error } = await supabase
    .from('ptm_sessions')
    .select('*')
    .eq('school_id', schoolId)
    .order('ptm_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, title: r.title, ptmDate: r.ptm_date }));
}

export async function createSession(schoolId: string, sessionId: string | undefined, title: string, ptmDate: string): Promise<void> {
  const { error } = await supabase.from('ptm_sessions').insert({
    school_id: schoolId,
    academic_session_id: sessionId || null,
    title,
    ptm_date: ptmDate,
  });
  if (error) throw error;
}

export async function listSlots(schoolId: string, ptmSessionId: string): Promise<PtmSlot[]> {
  const { data, error } = await supabase
    .from('ptm_slots')
    .select('*, teachers(full_name)')
    .eq('school_id', schoolId)
    .eq('ptm_session_id', ptmSessionId)
    .order('start_time');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    ptmSessionId: r.ptm_session_id,
    teacherId: r.teacher_id,
    teacherName: r.teachers?.full_name,
    startTime: r.start_time,
    endTime: r.end_time,
    isBooked: r.is_booked,
  }));
}

export async function createSlot(input: {
  schoolId: string;
  ptmSessionId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
}): Promise<void> {
  const { error } = await supabase.from('ptm_slots').insert({
    school_id: input.schoolId,
    ptm_session_id: input.ptmSessionId,
    teacher_id: input.teacherId,
    start_time: input.startTime,
    end_time: input.endTime,
  });
  if (error) throw error;
}

export async function listBookings(schoolId: string): Promise<PtmBooking[]> {
  const { data, error } = await supabase
    .from('ptm_bookings')
    .select('*, students(first_name, last_name), ptm_slots(start_time, end_time, teachers(full_name))')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    ptmSlotId: r.ptm_slot_id,
    studentId: r.student_id,
    studentName: r.students ? `${r.students.first_name} ${r.students.last_name}` : undefined,
    teacherName: r.ptm_slots?.teachers?.full_name,
    startTime: r.ptm_slots?.start_time,
    endTime: r.ptm_slots?.end_time,
    parentName: r.parent_name,
    parentPhone: r.parent_phone,
    notes: r.notes,
  }));
}

export async function bookSlot(input: {
  schoolId: string;
  ptmSlotId: string;
  studentId: string;
  parentName: string;
  parentPhone?: string;
  notes?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('ptm_bookings').insert({
    school_id: input.schoolId,
    ptm_slot_id: input.ptmSlotId,
    student_id: input.studentId,
    parent_name: input.parentName,
    parent_phone: input.parentPhone || null,
    notes: input.notes || null,
    booked_by: user?.id ?? null,
  });
  if (error) throw error;
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await supabase.from('ptm_bookings').delete().eq('id', id);
  if (error) throw error;
}
