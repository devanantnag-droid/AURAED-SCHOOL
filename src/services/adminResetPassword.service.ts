import { supabase } from '@/lib/supabase';

export async function adminResetPassword(targetUserId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('admin-reset-password', {
    body: { targetUserId, newPassword },
  });

  if (error) {
    throw new Error(error.message || 'Failed to reset password.');
  }

  return data as { success: boolean; message: string };
}
