import { supabase } from '@/lib/supabase';
import type { EventTargetType, RsvpResponse, SchoolEvent } from '@/types/events';

export async function listEvents(schoolId: string): Promise<SchoolEvent[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('events')
    .select('*, classes(name)')
    .eq('school_id', schoolId)
    .order('event_date', { ascending: true });
  if (error) throw error;

  const events: SchoolEvent[] = (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    eventDate: r.event_date,
    startTime: r.start_time,
    endTime: r.end_time,
    location: r.location,
    targetType: r.target_type,
    targetRole: r.target_role,
    targetClassId: r.target_class_id,
    targetClassName: r.classes?.name,
  }));

  if (events.length === 0 || !user) return events;

  const { data: myRsvps } = await supabase
    .from('event_rsvps')
    .select('event_id, response')
    .eq('user_id', user.id)
    .in('event_id', events.map((e) => e.id));

  const rsvpMap = new Map((myRsvps ?? []).map((r) => [r.event_id, r.response as RsvpResponse]));
  return events.map((e) => ({ ...e, myRsvp: rsvpMap.get(e.id) ?? null }));
}

export async function getRsvpCounts(eventId: string): Promise<{ going: number; maybe: number; not_going: number }> {
  const { data, error } = await supabase.from('event_rsvps').select('response').eq('event_id', eventId);
  if (error) throw error;
  const counts = { going: 0, maybe: 0, not_going: 0 };
  for (const r of data ?? []) counts[r.response as RsvpResponse]++;
  return counts;
}

export async function createEvent(input: {
  schoolId: string;
  title: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  targetType: EventTargetType;
  targetRole?: string;
  targetClassId?: string;
}): Promise<void> {
  const { error } = await supabase.from('events').insert({
    school_id: input.schoolId,
    title: input.title,
    description: input.description || null,
    event_date: input.eventDate,
    start_time: input.startTime || null,
    end_time: input.endTime || null,
    location: input.location || null,
    target_type: input.targetType,
    target_role: input.targetType === 'role' ? input.targetRole : null,
    target_class_id: input.targetType === 'class' ? input.targetClassId : null,
  });
  if (error) throw error;
}

export async function setRsvp(schoolId: string, eventId: string, response: RsvpResponse): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { error } = await supabase
    .from('event_rsvps')
    .upsert({ school_id: schoolId, event_id: eventId, user_id: user.id, response }, { onConflict: 'event_id,user_id' });
  if (error) throw error;
}
