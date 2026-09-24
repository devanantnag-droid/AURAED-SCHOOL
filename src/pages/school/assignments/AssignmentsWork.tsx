import { useEffect, useState } from 'react';
import { Paperclip, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses, listSections, listSessions, listSubjects } from '@/services/academics.service';
import { listTeachers } from '@/services/teachers.service';
import { getMyTeacherId } from '@/services/punch.service';
import {
  createAssignment,
  deleteAssignment,
  ensureSubmissionRows,
  gradeSubmission,
  listAssignments,
  listSubmissions,
} from '@/services/assignments.service';
import { getSignedDownloadUrl, uploadAttachment } from '@/services/storage.service';
import type { AcademicSession, ClassEntity, Section, Subject } from '@/types/academics';
import type { Teacher } from '@/types/people';
import type { Assignment, AssignmentSubmission } from '@/types/coursework';
import { PageHeader } from '@/components/shared/PageHeader';

// Each row owns its own expanded state and its own submission roster —
// this is what lets every assignment show its grading panel open by
// default at once, instead of the old single-shared-state accordion
// where opening one closed the others.
function AssignmentRow({ a, schoolId, onDelete, onDownload, onError }: {
  a: Assignment;
  schoolId: string | undefined;
  onDelete: (id: string) => void;
  onDownload: (path: string) => void;
  onError: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { marks: string; feedback: string }>>({});

  useEffect(() => {
    if (!expanded || loaded || !schoolId) return;
    (async () => {
      try {
        await ensureSubmissionRows(schoolId, a.id, a.classId, a.sectionId);
        setSubmissions(await listSubmissions(a.id));
        setLoaded(true);
      } catch (err) {
        onError(getErrorMessage(err, 'Failed to load submissions.'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, schoolId]);

  async function handleGrade(submissionId: string) {
    const draft = gradeDrafts[submissionId];
    if (!draft?.marks) return;
    try {
      await gradeSubmission(submissionId, Number(draft.marks), draft.feedback);
      setSubmissions(await listSubmissions(a.id));
    } catch (err) {
      onError(getErrorMessage(err, 'Failed to save grade.'));
    }
  }

  return (
    <li className="rounded-md border border-gray-200 text-sm dark:border-gray-800">
      <div className="flex items-center justify-between p-3">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-50">{a.title}</p>
          <p className="text-xs text-gray-500">
            {a.className} - {a.sectionName} · {a.subjectName} · {a.teacherName}
            {a.dueDate && ` · Due ${a.dueDate}`}
            {a.maxMarks && ` · Max ${a.maxMarks}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {a.attachmentPath && (
            <button onClick={() => onDownload(a.attachmentPath!)} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
              <Paperclip size={12} /> Attachment
            </button>
          )}
          <PermissionGate code="assignments.grade">
            <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-1 text-xs text-gray-600 hover:underline dark:text-gray-400">
              Grade <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </PermissionGate>
          <PermissionGate code="assignments.edit">
            <button onClick={() => onDelete(a.id)} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
              <Trash2 size={12} /> Delete
            </button>
          </PermissionGate>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          {!loaded ? (
            <p className="text-xs text-gray-500">Loading…</p>
          ) : submissions.length === 0 ? (
            <p className="text-xs text-gray-500">No students enrolled in this class/section.</p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="w-32 truncate font-medium text-gray-900 dark:text-gray-50">{s.studentName}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      s.status === 'graded'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {s.status}
                  </span>
                  <input
                    type="number"
                    placeholder="Marks"
                    className="input w-20 py-1"
                    defaultValue={s.marksObtained ?? ''}
                    onChange={(e) =>
                      setGradeDrafts((prev) => ({
                        ...prev,
                        [s.id]: { marks: e.target.value, feedback: prev[s.id]?.feedback ?? s.feedback ?? '' },
                      }))
                    }
                  />
                  <input
                    placeholder="Feedback"
                    className="input flex-1 py-1"
                    defaultValue={s.feedback ?? ''}
                    onChange={(e) =>
                      setGradeDrafts((prev) => ({
                        ...prev,
                        [s.id]: { marks: prev[s.id]?.marks ?? String(s.marksObtained ?? ''), feedback: e.target.value },
                      }))
                    }
                  />
                  <button onClick={() => handleGrade(s.id)} className="rounded-md bg-primary-600 px-2 py-1 text-white hover:bg-primary-700">
                    Save
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

function AssignmentsInner() {
  const { profile } = useAuth();
  const [myTeacherId, setMyTeacherId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [items, setItems] = useState<Assignment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
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
      setItems(await listAssignments(profile.schoolId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load assignments.'));
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
      let attachmentPath: string | null = null;
      if (file) {
        attachmentPath = await uploadAttachment('assignments', profile.schoolId, file);
      }
      await createAssignment({
        schoolId: profile.schoolId,
        sessionId,
        classId,
        sectionId,
        subjectId,
        teacherId,
        title,
        description,
        dueDate,
        maxMarks: maxMarks ? Number(maxMarks) : undefined,
        attachmentPath,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setMaxMarks('');
      setFile(null);
      loadItems();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to create assignment.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(path: string) {
    try {
      const url = await getSignedDownloadUrl('assignments', path);
      window.open(url, '_blank');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to open attachment.'));
    }
  }

  async function handleDelete(id: string) {
    setErrorMsg(null);
    try {
      await deleteAssignment(id);
      loadItems();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to delete assignment.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Assignments" subtitle="Note: students don't have self-submission accounts yet, so grading starts from the class roster — enter marks directly for each student below." />
      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <PermissionGate code="assignments.create">
        <section className="mb-8 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Create assignment</h2>

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

          <div className="mb-3 flex items-center gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Due date</label>
              <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Max marks</label>
              <input type="number" className="input max-w-[120px]" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
            </div>
          </div>

          <div className="mb-3">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>

          <button
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Create assignment'}
          </button>
        </section>
      </PermissionGate>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">All assignments</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No assignments yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((a) => (
              <AssignmentRow key={a.id} a={a} schoolId={profile?.schoolId} onDelete={handleDelete} onDownload={handleDownload} onError={setErrorMsg} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AssignmentsWorkPage() {
  return (
    <FeatureGate feature="assignments">
      <AssignmentsInner />
    </FeatureGate>
  );
}
