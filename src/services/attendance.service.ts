import { supabase } from '@/lib/supabase';
import type { AttendanceRecord, AttendanceStatus, ClassSection } from '@/types/attendance';

// Phase 7 normalized class/section into real tables. Every section that
// exists is a valid pick for attendance, even ones with zero students
// enrolled yet — unlike the old text-derived list, this doesn't silently
// hide a class until someone's assigned to it.
export async function listClassSections(schoolId: string): Promise<ClassSection[]> {
  const { data, error } = await supabase
    .from('sections')
    .select('id, name, classes(id, name, display_order)')
    .eq('school_id', schoolId);

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const cls = (row as unknown as { classes: { id: string; name: string; display_order: number } }).classes;
      return {
        classId: cls?.id ?? '',
        sectionId: row.id,
        className: cls?.name ?? '',
        sectionName: row.name,
        _order: cls?.display_order ?? 0,
      };
    })
    .filter((r) => r.classId)
    .sort((a, b) => a._order - b._order || a.className.localeCompare(b.className) || a.sectionName.localeCompare(b.sectionName))
    .map(({ classId, sectionId, className, sectionName }) => ({ classId, sectionId, className, sectionName }));
}

export interface RosterStudent {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  rollNumber: string | null;
}

export async function getClassRoster(schoolId: string, classId: string, sectionId: string): Promise<RosterStudent[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, first_name, last_name, admission_number, roll_number')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .eq('class_id', classId)
    .eq('section_id', sectionId)
    .order('roll_number', { ascending: true, nullsFirst: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    admissionNumber: row.admission_number,
    rollNumber: row.roll_number,
  }));
}

export async function getAttendanceForDate(
  studentIds: string[],
  date: string
): Promise<Map<string, AttendanceRecord>> {
  if (studentIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('student_attendance')
    .select('*')
    .in('student_id', studentIds)
    .eq('attendance_date', date);

  if (error) throw error;

  const map = new Map<string, AttendanceRecord>();
  (data ?? []).forEach((row) => {
    map.set(row.student_id, {
      id: row.id,
      studentId: row.student_id,
      attendanceDate: row.attendance_date,
      status: row.status,
      remarks: row.remarks,
    });
  });
  return map;
}

export async function saveAttendance(input: {
  schoolId: string;
  className: string;
  sectionName: string | null;
  date: string;
  entries: { studentId: string; status: AttendanceStatus }[];
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // class_name/section_name are stored as a point-in-time snapshot on each
  // attendance row — intentionally NOT re-derived later even if the class
  // gets renamed, since historical attendance should reflect what was true
  // on that date, not today's naming.
  const rows = input.entries.map((entry) => ({
    school_id: input.schoolId,
    student_id: entry.studentId,
    class_name: input.className,
    section_name: input.sectionName,
    attendance_date: input.date,
    status: entry.status,
    marked_by: user?.id ?? null,
  }));

  const { error } = await supabase
    .from('student_attendance')
    .upsert(rows, { onConflict: 'student_id,attendance_date' });

  if (error) throw error;
}

export async function getStudentAttendanceHistory(studentId: string, limit = 15): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('student_attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    studentId: row.student_id,
    attendanceDate: row.attendance_date,
    status: row.status,
    remarks: row.remarks,
  }));
}

export async function getStudentAttendancePercentage(studentId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('student_attendance')
    .select('status')
    .eq('student_id', studentId)
    .neq('status', 'holiday');

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const presentLike = data.filter((r) => r.status === 'present' || r.status === 'late').length;
  return Math.round((presentLike / data.length) * 100);
}
