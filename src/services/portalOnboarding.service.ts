import { supabase } from '@/lib/supabase';

export async function invitePortalLogin(
  personType: 'student' | 'parent',
  personId: string,
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('invite-portal-login', {
    body: { personType, personId, email, password },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create portal login.');
  }

  return data as { success: boolean; message: string };
}
