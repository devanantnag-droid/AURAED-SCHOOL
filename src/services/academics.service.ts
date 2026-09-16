import { supabase } from '@/lib/supabase';
import type {
  AcademicSession,
  ClassEntity,
  ClassTeacherAssignment,
  Section,
  Subject,
  SubjectTeacherAssignment,
  TimetableEntry,
} from '@/types/academics';

// ---------- Academic Sessions ----------

export async function listSessions(schoolId: string): Promise<AcademicSession[]> {
  const { data, error } = await supabase
    .from('academic_sessions')
    .select('*')
    .eq('school_id', schoolId)
    .order('start_date', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    startDate: r.start_date,
    endDate: r.end_date,
    isCurrent: r.is_current,
  }));
}

export async function createSession(
  schoolId: string,
  input: { name: string; startDate?: string; endDate?: string }
): Promise<void> {
  const { error } = await supabase.from('academic_sessions').insert({
    school_id: schoolId,
    name: input.name,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
  });
  if (error) throw error;
}

export async function setCurrentSession(schoolId: string, sessionId: string): Promise<void> {
  // Two-step: clear any existing current flag, then set the new one — the
  // partial unique index (one current session per school) means we can't
  // just flip one row without first clearing the other.
  const { error: clearError } = await supabase
    .from('academic_sessions')
    .update({ is_current: false })
    .eq('school_id', schoolId)
    .eq('is_current', true);
  if (clearError) throw clearError;

  const { error } = await supabase.from('academic_sessions').update({ is_current: true }).eq('id', sessionId);
  if (error) throw error;
}

// ---------- Classes & Sections ----------

export async function listClasses(schoolId: string): Promise<ClassEntity[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('school_id', schoolId)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, displayOrder: r.display_order }));
}

export async function createClass(schoolId: string, name: string, displayOrder = 0): Promise<ClassEntity> {
  const { data, error } = await supabase
    .from('classes')
    .insert({ school_id: schoolId, name, display_order: displayOrder })
    .select('*')
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, displayOrder: data.display_order };
}

export async function listSections(schoolId: string, classId?: string): Promise<Section[]> {
  let query = supabase.from('sections').select('*').eq('school_id', schoolId);
  if (classId) query = query.eq('class_id', classId);
  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, classId: r.class_id, name: r.name }));
}

export async function createSection(schoolId: string, classId: string, name: string): Promise<Section> {
  const { data, error } = await supabase
    .from('sections')
    .insert({ school_id: schoolId, class_id: classId, name })
    .select('*')
    .single();
  if (error) throw error;
  return { id: data.id, classId: data.class_id, name: data.name };
}

// ---------- Subjects ----------

export async function listSubjects(schoolId: string): Promise<Subject[]> {
  const { data, error } = await supabase.from('subjects').select('*').eq('school_id', schoolId).order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, code: r.code }));
}

export async function createSubject(schoolId: string, name: string, code: string): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .insert({ school_id: schoolId, name, code })
    .select('*')
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, code: data.code };
}

// ---------- Class Teacher / Subject Teacher assignments ----------

export async function listClassTeachers(schoolId: string, sessionId: string): Promise<ClassTeacherAssignment[]> {
  const { data, error } = await supabase
    .from('class_teachers')
    .select('*, teachers(full_name)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', sessionId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    academicSessionId: r.academic_session_id,
    classId: r.class_id,
    sectionId: r.section_id,
    teacherId: r.teacher_id,
    teacherName: (r as unknown as { teachers: { full_name: string } }).teachers?.full_name,
  }));
}

export async function assignClassTeacher(input: {
  schoolId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  teacherId: string;
}): Promise<void> {
  const { error } = await supabase.from('class_teachers').upsert(
    {
      school_id: input.schoolId,
      academic_session_id: input.sessionId,
      class_id: input.classId,
      section_id: input.sectionId,
      teacher_id: input.teacherId,
    },
    { onConflict: 'academic_session_id,class_id,section_id' }
  );
  if (error) throw error;
}

export async function listSubjectTeachers(
  schoolId: string,
  sessionId: string
): Promise<SubjectTeacherAssignment[]> {
  const { data, error } = await supabase
    .from('subject_teachers')
    .select('*, teachers(full_name), subjects(name)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', sessionId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    academicSessionId: r.academic_session_id,
    classId: r.class_id,
    sectionId: r.section_id,
    subjectId: r.subject_id,
    teacherId: r.teacher_id,
    teacherName: (r as unknown as { teachers: { full_name: string } }).teachers?.full_name,
    subjectName: (r as unknown as { subjects: { name: string } }).subjects?.name,
  }));
}

export async function assignSubjectTeacher(input: {
  schoolId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
}): Promise<void> {
  const { error } = await supabase.from('subject_teachers').upsert(
    {
      school_id: input.schoolId,
      academic_session_id: input.sessionId,
      class_id: input.classId,
      section_id: input.sectionId,
      subject_id: input.subjectId,
      teacher_id: input.teacherId,
    },
    { onConflict: 'academic_session_id,class_id,section_id,subject_id' }
  );
  if (error) throw error;
}

// ---------- Timetable ----------

export async function listTimetable(
  schoolId: string,
  sessionId: string,
  classId: string,
  sectionId: string
): Promise<TimetableEntry[]> {
  const { data, error } = await supabase
    .from('timetables')
    .select('*, subjects(name), teachers(full_name)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', sessionId)
    .eq('class_id', classId)
    .eq('section_id', sectionId)
    .order('day_of_week')
    .order('period_number');
  if (error) throw error;
  return (data ?? []).map(mapTimetableRow);
}

export async function listTeacherTimetable(schoolId: string, sessionId: string, teacherId: string): Promise<TimetableEntry[]> {
  const { data, error } = await supabase
    .from('timetables')
    .select('*, subjects(name), teachers(full_name), classes(name), sections(name)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', sessionId)
    .eq('teacher_id', teacherId)
    .order('day_of_week')
    .order('period_number');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...mapTimetableRow(r),
    className: (r as unknown as { classes: { name: string } }).classes?.name,
    sectionName: (r as unknown as { sections: { name: string } }).sections?.name,
  }));
}

export async function upsertTimetableEntry(input: {
  schoolId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime?: string;
  endTime?: string;
  room?: string;
}): Promise<void> {
  const { error } = await supabase.from('timetables').upsert(
    {
      school_id: input.schoolId,
      academic_session_id: input.sessionId,
      class_id: input.classId,
      section_id: input.sectionId,
      subject_id: input.subjectId,
      teacher_id: input.teacherId,
      day_of_week: input.dayOfWeek,
      period_number: input.periodNumber,
      start_time: input.startTime || null,
      end_time: input.endTime || null,
      room: input.room || null,
    },
    { onConflict: 'academic_session_id,class_id,section_id,day_of_week,period_number' }
  );
  if (error) throw error;
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  const { error } = await supabase.from('timetables').delete().eq('id', id);
  if (error) throw error;
}

function mapTimetableRow(r: {
  id: string;
  academic_session_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  period_number: number;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
}): TimetableEntry {
  return {
    id: r.id,
    academicSessionId: r.academic_session_id,
    classId: r.class_id,
    sectionId: r.section_id,
    subjectId: r.subject_id,
    teacherId: r.teacher_id,
    dayOfWeek: r.day_of_week,
    periodNumber: r.period_number,
    startTime: r.start_time,
    endTime: r.end_time,
    room: r.room,
    subjectName: (r as unknown as { subjects: { name: string } }).subjects?.name,
    teacherName: (r as unknown as { teachers: { full_name: string } }).teachers?.full_name,
  };
}
