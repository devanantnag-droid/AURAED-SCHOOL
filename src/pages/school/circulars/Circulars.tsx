import { useEffect, useState } from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses } from '@/services/academics.service';
import { createCircular, deleteCircular, getCircularAttachmentUrl, listCirculars } from '@/services/circulars.service';
import type { Circular, CircularTargetType } from '@/services/circulars.service';
import { ROLE_OPTIONS } from '@/types/messaging';
import type { ClassEntity } from '@/types/academics';
import { Collapsible } from '@/components/shared/Collapsible';
import { PageHeader } from '@/components/shared/PageHeader';

export function CircularsPage() {
  const { profile } = useAuth();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<CircularTargetType>('all');
  const [targetRole, setTargetRole] = useState(ROLE_OPTIONS[0]);
  const [targetClassId, setTargetClassId] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    if (!profile?.schoolId) return;
    const [c, cls] = await Promise.all([listCirculars(profile.schoolId), listClasses(profile.schoolId)]);
    setCirculars(c);
    setClasses(cls);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleSubmit() {
    if (!profile?.schoolId || !title.trim() || !body.trim()) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await createCircular({ schoolId: profile.schoolId, title, body, targetType, targetRole, targetClassId, attachmentFile });
      setTitle('');
      setBody('');
      setAttachmentFile(undefined);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to issue circular.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(path: string) {
    setErrorMsg(null);
    try {
      const url = await getCircularAttachmentUrl(path);
      window.open(url, '_blank');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to open attachment.'));
    }
  }

  async function handleDelete(id: string) {
    setErrorMsg(null);
    try {
      await deleteCircular(id);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to delete circular.'));
    }
  }

  return (
    <FeatureGate feature="circulars">
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Circulars" subtitle="Formal, numbered notices from the school — with an optional PDF attachment." />
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <PermissionGate code="circulars.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-primary-900 dark:text-gray-50">Issue a circular</h2>
          <input className="input mb-3 w-full" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input mb-3 w-full" rows={3} placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="mb-3 flex flex-wrap gap-2">
            <select className="input" value={targetType} onChange={(e) => setTargetType(e.target.value as CircularTargetType)}>
              <option value="all">Everyone</option>
              <option value="role">A role</option>
              <option value="class">A class</option>
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
          <div className="mb-3">
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setAttachmentFile(e.target.files?.[0])} className="text-sm" />
          </div>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? 'Issuing…' : 'Issue circular'}
          </button>
        </section>
      </PermissionGate>

      {circulars.length === 0 ? (
        <p className="text-sm text-gray-500">No circulars issued yet.</p>
      ) : (
        <ul className="space-y-2">
          {circulars.map((c) => (
            <li key={c.id} className="card p-3 text-sm">
              <Collapsible
                summary={
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-primary-900 dark:text-gray-50">{c.circularNumber} · {c.title}</p>
                    <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                }
              >
                <p className="mb-2 text-gray-600 dark:text-gray-400">{c.body}</p>
                <div className="flex items-center gap-3">
                  {c.attachmentPath && (
                    <button onClick={() => handleDownload(c.attachmentPath!)} className="flex items-center gap-1 text-xs text-primary-700 hover:underline dark:text-primary-300">
                      <Paperclip size={12} /> Attachment
                    </button>
                  )}
                  <PermissionGate code="circulars.manage">
                    <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
                      <Trash2 size={12} /> Delete
                    </button>
                  </PermissionGate>
                </div>
              </Collapsible>
            </li>
          ))}
        </ul>
      )}
    </div>
    </FeatureGate>
  );
}
