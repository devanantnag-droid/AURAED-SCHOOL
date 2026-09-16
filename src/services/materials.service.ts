import { supabase } from '@/lib/supabase';
import type { StudyMaterial } from '@/types/coursework';

function mapRow(r: any): StudyMaterial {
  return {
    id: r.id,
    classId: r.class_id,
    sectionId: r.section_id,
    subjectId: r.subject_id,
    teacherId: r.teacher_id,
    title: r.title,
    description: r.description,
    filePath: r.file_path,
    fileType: r.file_type,
    createdAt: r.created_at,
    className: r.classes?.name,
    sectionName: r.sections?.name,
    subjectName: r.subjects?.name,
  };
}

export async function listMaterials(schoolId: string): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from('study_materials')
    .select('*, classes(name), sections(name), subjects(name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createMaterial(input: {
  schoolId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description?: string;
  filePath?: string | null;
  fileType?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('study_materials').insert({
    school_id: input.schoolId,
    academic_session_id: input.sessionId,
    class_id: input.classId,
    section_id: input.sectionId,
    subject_id: input.subjectId,
    teacher_id: input.teacherId,
    title: input.title,
    description: input.description || null,
    file_path: input.filePath || null,
    file_type: input.fileType || null,
  });
  if (error) throw error;
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('study_materials').delete().eq('id', id);
  if (error) throw error;
}
