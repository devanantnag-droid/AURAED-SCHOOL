import { supabase } from '@/lib/supabase';

export async function createSuperAdmin(fullName: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('create-super-admin', {
    body: { fullName, email, password },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create Super Admin account.');
  }

  return data as { success: boolean; message: string };
}
