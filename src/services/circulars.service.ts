import { supabase } from '@/lib/supabase';
import { uploadAttachment, getSignedDownloadUrl } from '@/services/storage.service';

export type CircularTargetType = 'all' | 'role' | 'class';

export interface Circular {
  id: string;
  circularNumber: string;
  title: string;
  body: string;
  attachmentPath: string | null;
  targetType: CircularTargetType;
  targetRole: string | null;
  targetClassId: string | null;
  createdAt: string;
}

export async function listCirculars(schoolId: string): Promise<Circular[]> {
  const { data, error } = await supabase
    .from('circulars')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    circularNumber: r.circular_number,
    title: r.title,
    body: r.body,
    attachmentPath: r.attachment_path,
    targetType: r.target_type as CircularTargetType,
    targetRole: r.target_role,
    targetClassId: r.target_class_id,
    createdAt: r.created_at,
  }));
}

export async function createCircular(input: {
  schoolId: string;
  title: string;
  body: string;
  targetType: CircularTargetType;
  targetRole?: string;
  targetClassId?: string;
  attachmentFile?: File;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let attachmentPath: string | null = null;
  if (input.attachmentFile) {
    attachmentPath = await uploadAttachment('circulars', input.schoolId, input.attachmentFile);
  }

  const { error } = await supabase.from('circulars').insert({
    school_id: input.schoolId,
    circular_number: '',
    title: input.title,
    body: input.body,
    attachment_path: attachmentPath,
    target_type: input.targetType,
    target_role: input.targetType === 'role' ? input.targetRole : null,
    target_class_id: input.targetType === 'class' ? input.targetClassId : null,
    issued_by: user?.id ?? null,
  });
  if (error) throw error;
}

export async function deleteCircular(id: string): Promise<void> {
  const { error } = await supabase.from('circulars').delete().eq('id', id);
  if (error) throw error;
}

export async function getCircularAttachmentUrl(path: string): Promise<string> {
  return getSignedDownloadUrl('circulars', path);
}
