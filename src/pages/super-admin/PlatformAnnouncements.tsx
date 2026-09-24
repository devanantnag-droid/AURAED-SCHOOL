import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { createPlatformAnnouncement, deletePlatformAnnouncement, listPlatformAnnouncements } from '@/services/platformAnnouncements.service';
import type { PlatformAnnouncement, PlatformTargetType } from '@/services/platformAnnouncements.service';
import { ROLE_OPTIONS } from '@/types/messaging';

export function PlatformAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<PlatformTargetType>('all');
  const [targetRole, setTargetRole] = useState(ROLE_OPTIONS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setAnnouncements(await listPlatformAnnouncements());
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load announcements.'));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await createPlatformAnnouncement({ title, body, targetType, targetRole });
      setTitle('');
      setBody('');
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to send announcement.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setErrorMsg(null);
    try {
      await deletePlatformAnnouncement(id);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to delete announcement.'));
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-primary-900 dark:text-gray-50">Platform Announcements</h1>
      <p className="mb-5 text-sm text-gray-500">Broadcast to every school at once, or a specific role across every school.</p>

      {errorMsg && <p className="mb-4 max-w-2xl rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <section className="mb-6 max-w-2xl rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <input className="input mb-3 w-full" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input mb-3 w-full" rows={3} placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="mb-3 flex flex-wrap gap-2">
          <select className="input" value={targetType} onChange={(e) => setTargetType(e.target.value as PlatformTargetType)}>
            <option value="all">Everyone, every school</option>
            <option value="role">A specific role, every school</option>
          </select>
          {targetType === 'role' && (
            <select className="input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
          {submitting ? 'Sending…' : 'Send announcement'}
        </button>
      </section>

      {announcements.length === 0 ? (
        <p className="max-w-2xl text-sm text-gray-500">No platform announcements sent yet.</p>
      ) : (
        <ul className="max-w-2xl space-y-2">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium text-primary-900 dark:text-gray-50">{a.title}</p>
                <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{a.body}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-400">{a.targetType === 'all' ? 'Everyone' : a.targetRole}</p>
                <button onClick={() => handleDelete(a.id)} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
