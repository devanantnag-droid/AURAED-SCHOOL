import { supabase } from '@/lib/supabase';
import type { Announcement, AnnouncementTargetType, ColleagueProfile, Message } from '@/types/messaging';

// ---------- Announcements ----------

export async function listAnnouncements(schoolId: string): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, classes(name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    targetType: r.target_type,
    targetRole: r.target_role,
    targetClassId: r.target_class_id,
    targetClassName: r.classes?.name,
    createdAt: r.created_at,
  }));
}

export async function createAnnouncement(input: {
  schoolId: string;
  title: string;
  body: string;
  targetType: AnnouncementTargetType;
  targetRole?: string;
  targetClassId?: string;
}): Promise<void> {
  const { error } = await supabase.from('announcements').insert({
    school_id: input.schoolId,
    title: input.title,
    body: input.body,
    target_type: input.targetType,
    target_role: input.targetType === 'role' ? input.targetRole : null,
    target_class_id: input.targetType === 'class' ? input.targetClassId : null,
  });
  if (error) throw error;
}

// ---------- Messaging ----------

export async function listColleagues(schoolId: string): Promise<ColleagueProfile[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('school_id', schoolId)
    .neq('id', user?.id ?? '')
    .order('full_name');
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, fullName: r.full_name, email: r.email }));
}

export async function listConversation(otherUserId: string): Promise<Message[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    body: r.body,
    isRead: r.is_read,
    createdAt: r.created_at,
  }));
}

export async function sendMessage(schoolId: string, recipientId: string, body: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { error } = await supabase.from('messages').insert({
    school_id: schoolId,
    sender_id: user.id,
    recipient_id: recipientId,
    body,
  });
  if (error) throw error;
}

export async function markMessagesRead(otherUserId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('sender_id', otherUserId)
    .eq('is_read', false);
  if (error) throw error;
}
