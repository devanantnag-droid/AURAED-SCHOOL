import { supabase } from '@/lib/supabase';

export type AttachmentBucket = 'homework' | 'assignments' | 'study-materials';

// Path convention enforced by the matching Storage RLS policies:
// {school_id}/{random-id}-{filename}. The school_id prefix is what the
// policies check — a client can't upload/read outside its own school's
// folder no matter what path it tries to construct.
export async function uploadAttachment(
  bucket: AttachmentBucket,
  schoolId: string,
  file: File
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${schoolId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;

  return path;
}

export async function getSignedDownloadUrl(bucket: AttachmentBucket, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 5); // 5 minutes
  if (error) throw error;
  return data.signedUrl;
}
