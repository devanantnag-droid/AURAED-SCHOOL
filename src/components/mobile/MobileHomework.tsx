import { useEffect, useState } from 'react';
import { Paperclip, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';
import { getErrorMessage } from '@/lib/errors';
import { listHomework, createHomework } from '@/services/homework.service';
import type { Homework } from '@/types/coursework';
import { getSignedDownloadUrl } from '@/services/storage.service';
import { getMyTeacherId } from '@/services/punch.service';
import { listSessions, listSubjectTeachers } from '@/services/academics.service';
import { listClassSections } from '@/services/attendance.service';
import { useHasAnyPermission } from '@/hooks/usePermissions';

interface TeachingOption {
  classId: string;
  sectionId: string;
  subjectId: string;
  label: string;
}

export function MobileHomework({ onBack }: { onBack?: () => void } = {}) {
  const { profile } = useAuth();
  const canManage = useHasAnyPermission(['homework.create']);
  const [items, setItems] = useState<Homework[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Teacher "post homework" form state
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [options, setOptions] = useState<TeachingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState<string | null>(null);

  async function load() {
    if (!profile?.schoolId) return;
    try {
      setItems(await listHomework(profile.schoolId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load homework.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !canManage) return;
    (async () => {
      try {
        const [id, sessions, sections] = await Promise.all([
          getMyTeacherId(),
          listSessions(profile.schoolId!),
          listClassSections(profile.schoolId!),
        ]);
        setTeacherId(id);
        const current = sessions.find((s) => s.isCurrent) ?? sessions[0];
        if (!current || !id) return;
        setSessionId(current.id);

        const sectionNameByKey = new Map(sections.map((s) => [`${s.classId}|${s.sectionId}`, s]));
        const assignments = await listSubjectTeachers(profile.schoolId!, current.id);
        const mine = assignments.filter((a) => a.teacherId === id);
        setOptions(
          mine.map((a) => {
            const sec = sectionNameByKey.get(`${a.classId}|${a.sectionId}`);
            return {
              classId: a.classId,
              sectionId: a.sectionId,
              subjectId: a.subjectId,
              label: `${sec?.className ?? ''} ${sec?.sectionName ?? ''} · ${a.subjectName ?? ''}`,
            };
          })
        );
      } catch (err) {
        setErrorMsg(getErrorMessage(err, 'Failed to load your teaching assignments.'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId, canManage]);

  async function handlePost() {
    const chosen = options.find((o) => `${o.classId}|${o.sectionId}|${o.subjectId}` === selectedOption);
    if (!profile?.schoolId || !teacherId || !sessionId || !chosen || !title.trim()) return;
    setPosting(true);
    setPostMsg(null);
    setErrorMsg(null);
    try {
      await createHomework({
        schoolId: profile.schoolId,
        sessionId,
        classId: chosen.classId,
        sectionId: chosen.sectionId,
        subjectId: chosen.subjectId,
        teacherId,
        title,
        description,
        dueDate,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setPostMsg('Homework posted.');
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to post homework.'));
    } finally {
      setPosting(false);
    }
  }

  async function handleDownload(path: string) {
    setErrorMsg(null);
    try {
      const url = await getSignedDownloadUrl('homework', path);
      window.open(url, '_blank');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to open attachment.'));
    }
  }

  return (
    <div>
      <MobileDetailHeader title="Homework" onBack={onBack} />

      <div className="p-4">
        {errorMsg && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

        {canManage && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-sm font-semibold text-primary-900 dark:text-gray-50">Post homework</p>
            {options.length === 0 ? (
              <p className="text-xs text-gray-500">You have no class/subject assignments yet.</p>
            ) : (
              <>
                <select className="input mb-2 w-full" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                  <option value="">Class · Subject…</option>
                  {options.map((o) => (
                    <option key={`${o.classId}|${o.sectionId}|${o.subjectId}`} value={`${o.classId}|${o.sectionId}|${o.subjectId}`}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input className="input mb-2 w-full" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea className="input mb-2 w-full" rows={2} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                <input type="date" className="input mb-2 w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                {postMsg && <p className="mb-2 text-xs text-green-700 dark:text-green-400">{postMsg}</p>}
                <button onClick={handlePost} disabled={posting || !selectedOption || !title.trim()} className="btn-primary w-full">
                  {posting ? 'Posting…' : 'Post homework'}
                </button>
              </>
            )}
          </div>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
            <BookOpen size={32} />
            <p className="text-sm">No homework posted yet</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((h) => (
              <li key={h.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                  {h.subjectName ?? 'Subject'}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-50">{h.title}</p>
                {h.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{h.description}</p>}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {h.className} - {h.sectionName} · {h.teacherName ?? 'Teacher'}
                  </span>
                  {h.dueDate && <span>Due {h.dueDate}</span>}
                </div>
                {h.attachmentPath && (
                  <button
                    onClick={() => handleDownload(h.attachmentPath!)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    <Paperclip size={12} /> Attachment
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
