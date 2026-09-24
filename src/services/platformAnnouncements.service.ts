import { supabase } from '@/lib/supabase';

export type PlatformTargetType = 'all' | 'role';

export interface PlatformAnnouncement {
  id: string;
  title: string;
  body: string;
  targetType: PlatformTargetType;
  targetRole: string | null;
  createdAt: string;
}

export async function listPlatformAnnouncements(): Promise<PlatformAnnouncement[]> {
  const { data, error } = await supabase
    .from('platform_announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    targetType: r.target_type as PlatformTargetType,
    targetRole: r.target_role,
    createdAt: r.created_at,
  }));
}

export async function createPlatformAnnouncement(input: {
  title: string;
  body: string;
  targetType: PlatformTargetType;
  targetRole?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('platform_announcements').insert({
    title: input.title,
    body: input.body,
    target_type: input.targetType,
    target_role: input.targetType === 'role' ? input.targetRole : null,
    created_by: user?.id ?? null,
  });
  if (error) throw error;
}

export async function deletePlatformAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('platform_announcements').delete().eq('id', id);
  if (error) throw error;
}
