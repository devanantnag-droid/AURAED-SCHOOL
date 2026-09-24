import { supabase } from '@/lib/supabase';

export type DeletableEntityType = 'school' | 'teacher' | 'student' | 'staff' | 'parent';

export async function superAdminDelete(
  entityType: DeletableEntityType,
  id: string,
  confirmText: string,
  expectedConfirmText: string
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('super-admin-delete', {
    body: { entityType, id, confirmText, expectedConfirmText },
  });

  if (error) {
    throw new Error(error.message || 'Failed to delete.');
  }

  return data as { success: boolean; message: string };
}
