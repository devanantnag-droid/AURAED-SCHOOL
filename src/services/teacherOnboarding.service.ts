import { supabase } from '@/lib/supabase';

export async function inviteTeacherLogin(teacherId: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('invite-teacher-login', {
    body: { teacherId, email, password },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create teacher login.');
  }

  return data as { success: boolean; message: string };
}
