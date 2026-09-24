import { useEffect, useState } from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses, listSections, listSessions, listSubjects } from '@/services/academics.service';
import { listTeachers } from '@/services/teachers.service';
import { getMyTeacherId } from '@/services/punch.service';
import { createMaterial, deleteMaterial, listMaterials } from '@/services/materials.service';
import { getSignedDownloadUrl, uploadAttachment } from '@/services/storage.service';
import type { AcademicSession, ClassEntity, Section, Subject } from '@/types/academics';
import type { Teacher } from '@/types/people';
import type { StudyMaterial } from '@/types/coursework';
import { PageHeader } from '@/components/shared/PageHeader';

function MaterialsInner() {
  const { profile } = useAuth();
  const [myTeacherId, setMyTeacherId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [items, setItems] = useState<StudyMaterial[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  async function loadBase() {
    if (!profile?.schoolId) return;
    const [s, c, sub, t, myId] = await Promise.all([
      listSessions(profile.schoolId),
      listClasses(profile.schoolId),
      listSubjects(profile.schoolId),
      listTeachers(profile.schoolId),
      getMyTeacherId(),
    ]);
    setSessions(s);
    setClasses(c);
    setSubjects(sub);
    setTeachers(t.filter((x) => x.status === 'active'));
    setMyTeacherId(myId);
    if (myId) setTeacherId(myId);
    const current = s.find((x) => x.isCurrent) ?? s[0];
    if (current) setSessionId(current.id);
  }

  async function loadItems() {
    if (!profile?.schoolId) return;
    try {
      setItems(await listMaterials(profile.schoolId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load study materials.'));
    }
  }

  useEffect(() => {
    loadBase();
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !classId) return;
    listSections(profile.schoolId, classId).then(setSections);
  }, [profile?.schoolId, classId]);

  async function handleCreate() {
    if (!profile?.schoolId || !sessionId || !classId || !sectionId || !subjectId || !teacherId || !title.trim()) {
      setErrorMsg('Please fill in class, section, subject, teacher, and title.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      let filePath: string | null = null;
      if (file) {
        filePath = await uploadAttachment('study-materials', profile.schoolId, file);
      }
      await createMaterial({
        schoolId: profile.schoolId,
        sessionId,
        classId,
        sectionId,
        subjectId,
        teacherId,
        title,
        description,
        filePath,
        fileType: file?.type ?? null,
      });
      setTitle('');
      setDescription('');
      setFile(null);
      loadItems();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to upload study material.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(path: string) {
    try {
      const url = await getSignedDownloadUrl('study-materials', path);
      window.open(url, '_blank');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to open file.'));
    }
  }

  async function handleDelete(id: string) {
    setErrorMsg(null);
    try {
      await deleteMaterial(id);
      loadItems();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to delete study material.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Study Materials" />
      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <PermissionGate code="study_materials.create">
        <section className="mb-8 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Upload material</h2>

          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(''); }}>
              <option value="">Class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
              <option value="">Section…</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {!myTeacherId && (
            <div className="mb-3">
              <select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">Assign as teacher…</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </div>
          )}

          <input className="input mb-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input mb-3" rows={2} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="mb-3">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>

          <button
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Uploading…' : 'Upload material'}
          </button>
        </section>
      </PermissionGate>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">All materials</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No study materials uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">{m.title}</p>
                  <p className="text-xs text-gray-500">
                    {m.className} - {m.sectionName} · {m.subjectName}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {m.filePath && (
                    <button onClick={() => handleDownload(m.filePath!)} className="flex items-center gap-1 text-primary-600 hover:underline">
                      <Paperclip size={12} /> Download
                    </button>
                  )}
                  <PermissionGate code="study_materials.edit">
                    <button onClick={() => handleDelete(m.id)} className="flex items-center gap-1 text-red-600 hover:underline">
                      <Trash2 size={12} /> Delete
                    </button>
                  </PermissionGate>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function MaterialsPage() {
  return (
    <FeatureGate feature="study_materials">
      <MaterialsInner />
    </FeatureGate>
  );
}
