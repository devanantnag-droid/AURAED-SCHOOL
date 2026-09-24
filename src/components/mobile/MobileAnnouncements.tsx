import { useEffect, useState } from 'react';
import { Megaphone, FileStack, CalendarDays, Paperclip } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { listAnnouncements } from '@/services/messaging.service';
import type { Announcement } from '@/types/messaging';
import { listCirculars, getCircularAttachmentUrl } from '@/services/circulars.service';
import type { Circular } from '@/services/circulars.service';
import { listEvents } from '@/services/events.service';
import type { SchoolEvent } from '@/types/events';

export function MobileAnnouncements({ schoolId }: { schoolId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAnnouncements(schoolId), listCirculars(schoolId), listEvents(schoolId)])
      .then(([a, c, e]) => {
        setAnnouncements(a);
        setCirculars(c);
        setEvents(e);
      })
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load announcements.')))
      .finally(() => setLoading(false));
  }, [schoolId]);

  async function handleDownload(path: string) {
    try {
      const url = await getCircularAttachmentUrl(path);
      window.open(url, '_blank');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to open attachment.'));
    }
  }

  const isEmpty = announcements.length === 0 && circulars.length === 0 && events.length === 0;

  return (
    <div className="p-4">
      {errorMsg && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
          <Megaphone size={32} />
          <p className="text-sm">Nothing posted yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {circulars.map((c) => (
            <li key={`c-${c.id}`} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                <FileStack size={12} /> {c.circularNumber}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{c.title}</p>
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{c.body}</p>
              {c.attachmentPath && (
                <button onClick={() => handleDownload(c.attachmentPath!)} className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline dark:text-primary-300">
                  <Paperclip size={12} /> Attachment
                </button>
              )}
            </li>
          ))}
          {announcements.map((a) => (
            <li key={`a-${a.id}`} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <Megaphone size={12} /> Announcement
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{a.title}</p>
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{a.body}</p>
            </li>
          ))}
          {events.map((e) => (
            <li key={`e-${e.id}`} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <CalendarDays size={12} /> Event · {e.eventDate}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{e.title}</p>
              {e.location && <p className="mt-0.5 text-xs text-gray-500">{e.location}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
