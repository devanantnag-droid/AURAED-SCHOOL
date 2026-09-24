export type EventTargetType = 'all' | 'role' | 'class';
export type RsvpResponse = 'going' | 'not_going' | 'maybe';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  targetType: EventTargetType;
  targetRole: string | null;
  targetClassId: string | null;
  targetClassName?: string;
  myRsvp?: RsvpResponse | null;
  rsvpCounts?: { going: number; maybe: number; not_going: number };
}
