import { supabase } from '@/lib/supabase';
import type { CorrectionRequest, PunchRecord } from '@/types/punch';

function mapPunchRow(row: {
  id: string;
  teacher_id: string;
  punch_date: string;
  punch_in: string | null;
  punch_out: string | null;
  working_minutes: number | null;
  status: 'open' | 'complete';
  latitude: number | null;
  longitude: number | null;
}): PunchRecord {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    punchDate: row.punch_date,
    punchIn: row.punch_in,
    punchOut: row.punch_out,
    workingMinutes: row.working_minutes,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export async function getMyTeacherId(): Promise<string | null> {
  const { data, error } = await supabase.rpc('current_teacher_id');
  if (error) throw error;
  return data;
}

export async function getTodayPunch(teacherId: string): Promise<PunchRecord | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('teacher_punch_records')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('punch_date', today)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPunchRow(data) : null;
}

export async function punchIn(
  schoolId: string,
  teacherId: string,
  location: { latitude: number | null; longitude: number | null }
): Promise<PunchRecord> {
  const { data, error } = await supabase
    .from('teacher_punch_records')
    .insert({
      school_id: schoolId,
      teacher_id: teacherId,
      punch_date: new Date().toISOString().slice(0, 10),
      punch_in: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
      device_info: navigator.userAgent,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapPunchRow(data);
}

export async function punchOut(
  recordId: string,
  location: { latitude: number | null; longitude: number | null }
): Promise<PunchRecord> {
  const { data, error } = await supabase
    .from('teacher_punch_records')
    .update({
      punch_out: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
    })
    .eq('id', recordId)
    .select('*')
    .single();

  if (error) throw error;
  return mapPunchRow(data);
}

export async function getMyPunchHistory(teacherId: string, limit = 15): Promise<PunchRecord[]> {
  const { data, error } = await supabase
    .from('teacher_punch_records')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('punch_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapPunchRow);
}

export interface SchoolPunchRow {
  id: string;
  teacher_id: string;
  punch_date: string;
  punch_in: string | null;
  punch_out: string | null;
  working_minutes: number | null;
  status: 'open' | 'complete';
  teachers: { full_name: string; employee_id: string } | null;
}

export async function listSchoolPunchesForDate(schoolId: string, date: string): Promise<SchoolPunchRow[]> {
  const { data, error } = await supabase
    .from('teacher_punch_records')
    .select('id, teacher_id, punch_date, punch_in, punch_out, working_minutes, status, teachers(full_name, employee_id)')
    .eq('school_id', schoolId)
    .eq('punch_date', date);
  if (error) throw error;
  return (data ?? []) as unknown as SchoolPunchRow[];
}

export async function submitCorrectionRequest(input: {
  schoolId: string;
  teacherId: string;
  punchRecordId?: string;
  punchDate: string;
  requestedPunchIn?: string;
  requestedPunchOut?: string;
  reason: string;
}): Promise<void> {
  const { error } = await supabase.from('attendance_correction_requests').insert({
    school_id: input.schoolId,
    teacher_id: input.teacherId,
    punch_record_id: input.punchRecordId ?? null,
    punch_date: input.punchDate,
    requested_punch_in: input.requestedPunchIn ?? null,
    requested_punch_out: input.requestedPunchOut ?? null,
    reason: input.reason,
  });
  if (error) throw error;
}

export async function getMyCorrectionRequests(teacherId: string): Promise<CorrectionRequest[]> {
  const { data, error } = await supabase
    .from('attendance_correction_requests')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCorrectionRow);
}

export async function listSchoolCorrectionRequests(schoolId: string): Promise<CorrectionRequest[]> {
  const { data, error } = await supabase
    .from('attendance_correction_requests')
    .select('*, teachers(full_name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...mapCorrectionRow(row),
    teacherName: (row as unknown as { teachers: { full_name: string } }).teachers?.full_name,
  }));
}

export async function approveCorrectionRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('apply_attendance_correction', { p_request_id: requestId });
  if (error) throw error;
}

export async function rejectCorrectionRequest(requestId: string, rejectionReason: string): Promise<void> {
  const { error } = await supabase
    .from('attendance_correction_requests')
    .update({ status: 'rejected', rejection_reason: rejectionReason })
    .eq('id', requestId);
  if (error) throw error;
}

export async function getMissingPunches(
  schoolId: string,
  date: string
): Promise<{ id: string; fullName: string; employeeId: string }[]> {
  const [{ data: teachers, error: teacherError }, punches] = await Promise.all([
    supabase.from('teachers').select('id, full_name, employee_id').eq('school_id', schoolId).eq('status', 'active'),
    listSchoolPunchesForDate(schoolId, date),
  ]);

  if (teacherError) throw teacherError;

  const punchedIds = new Set(punches.map((p) => p.teacher_id));
  return (teachers ?? [])
    .filter((t) => !punchedIds.has(t.id))
    .map((t) => ({ id: t.id, fullName: t.full_name, employeeId: t.employee_id }));
}

function mapCorrectionRow(row: {
  id: string;
  teacher_id: string;
  punch_date: string;
  requested_punch_in: string | null;
  requested_punch_out: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}): CorrectionRequest {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    punchDate: row.punch_date,
    requestedPunchIn: row.requested_punch_in,
    requestedPunchOut: row.requested_punch_out,
    reason: row.reason,
    status: row.status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
  };
}
