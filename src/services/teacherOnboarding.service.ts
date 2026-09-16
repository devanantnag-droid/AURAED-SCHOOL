import { supabase } from '@/lib/supabase';

export async function inviteTeacherLogin(teacherId: string, email: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('invite-teacher-login', {
    body: { teacherId, email },
  });

  if (error) {
    throw new Error(error.message || 'Failed to invite teacher login.');
  }

  return data as { success: boolean; message: string };
}
