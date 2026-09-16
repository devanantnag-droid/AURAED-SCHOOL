import { supabase } from '@/lib/supabase';
import type { Homework } from '@/types/coursework';

function mapRow(r: any): Homework {
  return {
    id: r.id,
    classId: r.class_id,
    sectionId: r.section_id,
    subjectId: r.subject_id,
    teacherId: r.teacher_id,
    title: r.title,
    description: r.description,
    dueDate: r.due_date,
    attachmentPath: r.attachment_path,
    isPublished: r.is_published,
    createdAt: r.created_at,
    className: r.classes?.name,
    sectionName: r.sections?.name,
    subjectName: r.subjects?.name,
    teacherName: r.teachers?.full_name,
  };
}

export async function listHomework(schoolId: string): Promise<Homework[]> {
  const { data, error } = await supabase
    .from('homework')
    .select('*, classes(name), sections(name), subjects(name), teachers(full_name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createHomework(input: {
  schoolId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description?: string;
  dueDate?: string;
  attachmentPath?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('homework').insert({
    school_id: input.schoolId,
    academic_session_id: input.sessionId,
    class_id: input.classId,
    section_id: input.sectionId,
    subject_id: input.subjectId,
    teacher_id: input.teacherId,
    title: input.title,
    description: input.description || null,
    due_date: input.dueDate || null,
    attachment_path: input.attachmentPath || null,
  });
  if (error) throw error;
}

export async function deleteHomework(id: string): Promise<void> {
  const { error } = await supabase.from('homework').delete().eq('id', id);
  if (error) throw error;
}
