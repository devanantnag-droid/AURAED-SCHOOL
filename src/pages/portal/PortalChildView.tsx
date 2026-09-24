import { useEffect, useState } from 'react';
import { BookOpen, CalendarCheck, ClipboardList, MessageSquareText, Paperclip, Receipt } from 'lucide-react';
import { getSignedDownloadUrl } from '@/services/storage.service';
import { MyLeaveRequests } from '@/components/shared/MyLeaveRequests';
import { getErrorMessage } from '@/lib/errors';
import { getPortalSummary } from '@/services/portal.service';
import { listAnnouncements } from '@/services/messaging.service';
import { listCirculars } from '@/services/circulars.service';
import type { Circular } from '@/services/circulars.service';
import { listEvents } from '@/services/events.service';
import {
  addGrievanceReply,
  createGrievance,
  listGrievanceReplies,
  listGrievances,
  GRIEVANCE_CATEGORIES,
} from '@/services/grievances.service';
import { listTeachers } from '@/services/teachers.service';
import type { PortalSummary } from '@/services/portal.service';
import type { Announcement } from '@/types/messaging';
import type { SchoolEvent } from '@/types/events';
import type { Grievance, GrievanceCategory, GrievanceReply } from '@/services/grievances.service';
import type { Teacher } from '@/types/people';
import { ParentSurveys } from '@/components/shared/ParentSurveys';
import { MySeatAssignments } from '@/components/shared/MySeatAssignments';
import { MyBusLocation } from '@/components/shared/MyBusLocation';

interface Props {
  schoolId: string;
  studentId: string;
  studentName: string;
  className: string | null;
  sectionName: string | null;
}

function EmptyState({ icon: Icon, message }: { icon: typeof BookOpen; message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-800">
      <Icon size={16} className="shrink-0 text-gray-400" />
      {message}
    </div>
  );
}

export function PortalChildView({ schoolId, studentId, studentName, className, sectionName }: Props) {
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'grievances' | 'leave' | 'surveys'>('overview');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<GrievanceReply[]>([]);
  const [replyDraft, setReplyDraft] = useState('');

  const [gSubject, setGSubject] = useState('');
  const [gDescription, setGDescription] = useState('');
  const [gCategory, setGCategory] = useState<GrievanceCategory>('other');
  const [gTeacherId, setGTeacherId] = useState('');

  async function loadAll() {
    setErrorMsg(null);
    try {
      const [s, a, e, ci, g, t] = await Promise.all([
        getPortalSummary(schoolId, studentId),
        listAnnouncements(schoolId),
        listEvents(schoolId),
        listCirculars(schoolId),
        listGrievances(),
        listTeachers(schoolId),
      ]);
      setSummary(s);
      setAnnouncements(a);
      setEvents(e);
      setCirculars(ci);
      setGrievances(g.filter((x) => x.studentId === studentId));
      setTeachers(t.filter((x) => x.status === 'active'));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load your dashboard.'));
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function handleRaiseGrievance() {
    if (!gSubject.trim() || !gDescription.trim()) return;
    setErrorMsg(null);
    try {
      await createGrievance({
        schoolId,
        studentId,
        subject: gSubject,
        description: gDescription,
        category: gCategory,
        againstTeacherId: gTeacherId || undefined,
      });
      setGSubject('');
      setGDescription('');
      setGTeacherId('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to submit grievance.'));
    }
  }

  async function handleDownload(bucket: 'homework' | 'assignments', path: string) {
    setErrorMsg(null);
    try {
      const url = await getSignedDownloadUrl(bucket, path);
      window.open(url, '_blank');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to open attachment.'));
    }
  }

  async function toggleExpand(g: Grievance) {
    if (expandedId === g.id) {
      setExpandedId(null);
      return;
    }
    setReplies(await listGrievanceReplies(g.id));
    setExpandedId(g.id);
  }

  async function handleReply(grievanceId: string) {
    if (!replyDraft.trim()) return;
    setErrorMsg(null);
    try {
      await addGrievanceReply(grievanceId, replyDraft);
      setReplyDraft('');
      setReplies(await listGrievanceReplies(grievanceId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to send reply.'));
    }
  }

  return (
    <div>
      <div className="mb-4 rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h1 className="font-serif text-xl font-medium text-primary-900 dark:text-gray-50">{studentName}</h1>
        {(className || sectionName) && (
          <p className="text-sm text-gray-500">Class {className}{sectionName && ` - ${sectionName}`}</p>
        )}
      </div>

      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200 text-sm dark:border-gray-800">
        {(['overview', 'grievances', 'leave', 'surveys'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 whitespace-nowrap border-b-2 px-3 py-2 capitalize ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        !summary ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs text-gray-500">Attendance</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {summary.attendancePercentage !== null ? `${summary.attendancePercentage}%` : 'Not marked yet'}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs text-gray-500">Fee lines</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">{summary.fees.length}</p>
              </div>
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs text-gray-500">Pending fees</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {summary.fees.filter((f) => f.status !== 'paid').length}
                </p>
              </div>
            </div>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Fees</h2>
              {summary.fees.length === 0 ? (
                <EmptyState icon={Receipt} message="No fees have been assigned yet — nothing due right now." />
              ) : (
                <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
                  {summary.fees.map((f) => (
                    <li key={f.id} className="flex items-center justify-between px-3 py-2">
                      <span>{f.categoryName}</span>
                      <span className="text-xs text-gray-500">
                        Due ₹{f.amountDue - f.discount} · Paid ₹{f.amountPaid} · <span className="capitalize">{f.status}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Homework</h2>
              {summary.homework.length === 0 ? (
                <EmptyState icon={BookOpen} message="No homework posted yet — check back after class." />
              ) : (
                <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
                  {summary.homework.slice(0, 10).map((h) => (
                    <li key={h.id} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-50">{h.title}</p>
                        <p className="text-xs text-gray-500">{h.subjectName} {h.dueDate && `· Due ${h.dueDate}`}</p>
                      </div>
                      {h.attachmentPath && (
                        <button onClick={() => handleDownload('homework', h.attachmentPath!)} className="flex shrink-0 items-center gap-1 text-xs text-primary-600 hover:underline">
                          <Paperclip size={12} /> Attachment
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Assignments</h2>
              {summary.assignments.length === 0 ? (
                <EmptyState icon={ClipboardList} message="No assignments posted yet." />
              ) : (
                <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
                  {summary.assignments.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-50">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.subjectName} {a.dueDate && `· Due ${a.dueDate}`} {a.maxMarks && `· Max ${a.maxMarks}`}</p>
                      </div>
                      {a.attachmentPath && (
                        <button onClick={() => handleDownload('assignments', a.attachmentPath!)} className="flex shrink-0 items-center gap-1 text-xs text-primary-600 hover:underline">
                          <Paperclip size={12} /> Attachment
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Recent marks</h2>
              {summary.recentMarks.length === 0 ? (
                <EmptyState icon={CalendarCheck} message="No marks recorded yet — results will show up here once an exam is graded." />
              ) : (
                <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
                  {summary.recentMarks.map((m, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-2">
                      <span>{m.subjectName} · {m.examName}</span>
                      <span className="text-xs text-gray-500">{m.marksObtained ?? '-'} / {m.maxMarks}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Exam Seating</h2>
              <MySeatAssignments studentId={studentId} />
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Bus Location</h2>
              <MyBusLocation studentId={studentId} />
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Circulars, Announcements & Events</h2>
              {announcements.length === 0 && events.length === 0 && circulars.length === 0 ? (
                <EmptyState icon={MessageSquareText} message="No announcements or events posted yet — you'll see them here as soon as the school shares something." />
              ) : (
                <ul className="space-y-2">
                  {circulars.slice(0, 5).map((c) => (
                    <li key={c.id} className="rounded-md border border-gray-200 p-2 text-sm dark:border-gray-800">
                      <p className="font-medium text-gray-900 dark:text-gray-50">{c.circularNumber}: {c.title}</p>
                      <p className="text-xs text-gray-500">{c.body}</p>
                    </li>
                  ))}
                  {announcements.slice(0, 5).map((a) => (
                    <li key={a.id} className="rounded-md border border-gray-200 p-2 text-sm dark:border-gray-800">
                      <p className="font-medium text-gray-900 dark:text-gray-50">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.body}</p>
                    </li>
                  ))}
                  {events.slice(0, 5).map((e) => (
                    <li key={e.id} className="rounded-md border border-gray-200 p-2 text-sm dark:border-gray-800">
                      <p className="font-medium text-gray-900 dark:text-gray-50">{e.title} <span className="font-normal text-gray-500">· {e.eventDate}</span></p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )
      ) : tab === 'grievances' ? (
        <div>
          <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Raise a grievance</h2>
            <input className="input mb-3 w-full" placeholder="Subject" value={gSubject} onChange={(e) => setGSubject(e.target.value)} />
            <textarea className="input mb-3 w-full" rows={3} placeholder="Describe the issue in detail" value={gDescription} onChange={(e) => setGDescription(e.target.value)} />
            <div className="mb-3 flex flex-wrap gap-2">
              <select className="input" value={gCategory} onChange={(e) => setGCategory(e.target.value as GrievanceCategory)}>
                {GRIEVANCE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {gCategory === 'teacher_conduct' && (
                <select className="input" value={gTeacherId} onChange={(e) => setGTeacherId(e.target.value)}>
                  <option value="">Which teacher? (optional)</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              )}
            </div>
            <p className="mb-3 text-xs text-gray-500">
              This goes directly and privately to the School Admin. The named teacher, if any, will not automatically see this.
            </p>
            <button onClick={handleRaiseGrievance} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Submit
            </button>
          </section>

          {grievances.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing raised yet — hopefully everything's going well! Use the form above if that changes.</p>
          ) : (
            <ul className="space-y-2">
              {grievances.map((g) => (
                <li key={g.id} className="rounded-md border border-gray-200 text-sm dark:border-gray-800">
                  <button onClick={() => toggleExpand(g)} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{g.subject}</p>
                      <p className="text-xs text-gray-500">{GRIEVANCE_CATEGORIES.find((c) => c.value === g.category)?.label}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600 dark:bg-gray-800 dark:text-gray-400">{g.status.replace('_', ' ')}</span>
                  </button>
                  {expandedId === g.id && (
                    <div className="border-t border-gray-100 p-3 dark:border-gray-800">
                      <p className="mb-3 text-gray-600 dark:text-gray-400">{g.description}</p>
                      {replies.length > 0 && (
                        <ul className="mb-3 space-y-2">
                          {replies.map((r) => (
                            <li key={r.id} className="rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-900">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{r.senderName ?? 'School'}:</span> {r.body}
                            </li>
                          ))}
                        </ul>
                      )}
                      {g.status !== 'closed' && (
                        <div className="flex gap-2">
                          <input className="input flex-1" placeholder="Write a reply…" value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} />
                          <button onClick={() => handleReply(g.id)} className="rounded-md bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700">
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : tab === 'leave' ? (
        <MyLeaveRequests schoolId={schoolId} requesterType="student" studentId={studentId} />
      ) : (
        <ParentSurveys />
      )}
    </div>
  );
}
