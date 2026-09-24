import { useEffect, useState } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses } from '@/services/academics.service';
import { createEvent, getRsvpCounts, listEvents, setRsvp } from '@/services/events.service';
import { ROLE_OPTIONS } from '@/types/messaging';
import type { EventTargetType, RsvpResponse, SchoolEvent } from '@/types/events';
import type { ClassEntity } from '@/types/academics';
import { PageHeader } from '@/components/shared/PageHeader';

const RSVP_OPTIONS: { value: RsvpResponse; label: string }[] = [
  { value: 'going', label: 'Going' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'not_going', label: "Can't go" },
];

function EventsInner() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, { going: number; maybe: number; not_going: number }>>({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [targetType, setTargetType] = useState<EventTargetType>('all');
  const [targetRole, setTargetRole] = useState('TEACHER');
  const [targetClassId, setTargetClassId] = useState('');

  async function loadAll() {
    if (!profile?.schoolId) return;
    const [e, c] = await Promise.all([listEvents(profile.schoolId), listClasses(profile.schoolId)]);
    setEvents(e);
    setClasses(c);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function loadCounts(eventId: string) {
    setRsvpCounts((prev) => ({ ...prev, [eventId]: prev[eventId] ?? { going: 0, maybe: 0, not_going: 0 } }));
    const counts = await getRsvpCounts(eventId);
    setRsvpCounts((prev) => ({ ...prev, [eventId]: counts }));
  }

  async function handleCreate() {
    if (!profile?.schoolId || !title.trim() || !eventDate) return;
    setErrorMsg(null);
    try {
      await createEvent({
        schoolId: profile.schoolId,
        title,
        description,
        eventDate,
        startTime,
        endTime,
        location,
        targetType,
        targetRole,
        targetClassId,
      });
      setTitle('');
      setDescription('');
      setEventDate('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to create event.'));
    }
  }

  async function handleRsvp(eventId: string, response: RsvpResponse) {
    if (!profile?.schoolId) return;
    setErrorMsg(null);
    try {
      await setRsvp(profile.schoolId, eventId, response);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to RSVP.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Events & Calendar" />
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <PermissionGate code="events.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">New event</h2>
          <input className="input mb-3 w-full" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input mb-3 w-full" rows={2} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            <input className="input" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <select className="input" value={targetType} onChange={(e) => setTargetType(e.target.value as EventTargetType)}>
              <option value="all">Everyone</option>
              <option value="role">A specific role</option>
              <option value="class">A specific class</option>
            </select>
            {targetType === 'role' && (
              <select className="input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
            {targetType === 'class' && (
              <select className="input" value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)}>
                <option value="">Class…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <button onClick={handleCreate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Create event
          </button>
        </section>
      </PermissionGate>

      {events.length === 0 ? (
        <p className="text-sm text-gray-500">No upcoming events.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium text-gray-900 dark:text-gray-50">{e.title}</p>
                <span className="text-xs text-gray-500">{e.eventDate}</span>
              </div>
              {e.description && <p className="mb-1 text-gray-600 dark:text-gray-400">{e.description}</p>}
              <div className="mb-2 flex flex-wrap gap-3 text-xs text-gray-500">
                {(e.startTime || e.endTime) && (
                  <span className="flex items-center gap-1"><Clock size={12} /> {e.startTime ?? '?'}{e.endTime && ` – ${e.endTime}`}</span>
                )}
                {e.location && <span className="flex items-center gap-1"><MapPin size={12} /> {e.location}</span>}
                <span>{e.targetType === 'all' ? 'Everyone' : e.targetType === 'role' ? e.targetRole : e.targetClassName}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {RSVP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRsvp(e.id, opt.value)}
                    className={`rounded-md border px-2 py-1 text-xs ${
                      e.myRsvp === opt.value
                        ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                        : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                <PermissionGate code="events.manage">
                  <button onClick={() => loadCounts(e.id)} className="text-xs text-primary-600 hover:underline">
                    {rsvpCounts[e.id] ? `Going ${rsvpCounts[e.id].going} · Maybe ${rsvpCounts[e.id].maybe} · Can't go ${rsvpCounts[e.id].not_going}` : 'View RSVPs'}
                  </button>
                </PermissionGate>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EventsPage() {
  return (
    <FeatureGate feature="events">
      <EventsInner />
    </FeatureGate>
  );
}
