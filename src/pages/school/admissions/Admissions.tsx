import { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses, listSessions } from '@/services/academics.service';
import {
  admitApplicant,
  createAdmission,
  getSignedDocumentUrl,
  listAdmissions,
  listDocuments,
  scheduleInterview,
  setAdmissionStatus,
  uploadDocument,
} from '@/services/admissions.service';
import { ADMISSION_STATUSES } from '@/types/admissions';
import type { Admission, AdmissionDocument, AdmissionStatus } from '@/types/admissions';
import type { AcademicSession, ClassEntity } from '@/types/academics';
import { PageHeader } from '@/components/shared/PageHeader';

const statusStyles: Record<AdmissionStatus, string> = {
  enquiry: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  admitted: 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
};

function AdmissionsInner() {
  const { profile } = useAuth();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<AdmissionDocument[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [applyingForClassId, setApplyingForClassId] = useState('');

  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  async function loadAll() {
    if (!profile?.schoolId) return;
    const [a, c, s] = await Promise.all([
      listAdmissions(profile.schoolId),
      listClasses(profile.schoolId),
      listSessions(profile.schoolId),
    ]);
    setAdmissions(a);
    setClasses(c);
    setSessions(s);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleCreate() {
    if (!profile?.schoolId || !firstName.trim() || !lastName.trim()) return;
    setErrorMsg(null);
    try {
      const current = sessions.find((s) => s.isCurrent) ?? sessions[0];
      await createAdmission({
        schoolId: profile.schoolId,
        sessionId: current?.id,
        firstName,
        lastName,
        dateOfBirth,
        parentName,
        parentPhone,
        applyingForClassId,
      });
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setParentName('');
      setParentPhone('');
      setApplyingForClassId('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add applicant.'));
    }
  }

  async function handleStatusChange(id: string, status: AdmissionStatus) {
    setErrorMsg(null);
    try {
      await setAdmissionStatus(id, status);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update status.'));
    }
  }

  async function handleScheduleInterview(id: string) {
    if (!interviewDate) return;
    setErrorMsg(null);
    try {
      await scheduleInterview(id, interviewDate, interviewNotes);
      setInterviewDate('');
      setInterviewNotes('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to schedule interview.'));
    }
  }

  async function handleAdmit(admission: Admission) {
    if (!profile?.schoolId) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await admitApplicant(profile.schoolId, admission);
      setSuccessMsg(`${admission.applicantFirstName} ${admission.applicantLastName} has been admitted as a student.`);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to admit applicant.'));
    }
  }

  async function toggleExpand(admission: Admission) {
    if (expandedId === admission.id) {
      setExpandedId(null);
      return;
    }
    setDocuments(await listDocuments(admission.id));
    setExpandedId(admission.id);
  }

  async function handleUploadDocument(admissionId: string) {
    if (!profile?.schoolId || !file) return;
    setErrorMsg(null);
    try {
      await uploadDocument(profile.schoolId, admissionId, file);
      setFile(null);
      setDocuments(await listDocuments(admissionId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to upload document.'));
    }
  }

  async function handleDownloadDocument(path: string) {
    try {
      const url = await getSignedDocumentUrl(path);
      window.open(url, '_blank');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to open document.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Admissions" />
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      {successMsg && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{successMsg}</p>}

      <PermissionGate code="admissions.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">New applicant</h2>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <input className="input" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="input" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <input type="date" className="input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            <input className="input" placeholder="Parent name" value={parentName} onChange={(e) => setParentName(e.target.value)} />
            <input className="input" placeholder="Parent phone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
            <select className="input" value={applyingForClassId} onChange={(e) => setApplyingForClassId(e.target.value)}>
              <option value="">Applying for class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Add applicant
          </button>
        </section>
      </PermissionGate>

      {admissions.length === 0 ? (
        <p className="text-sm text-gray-500">No applicants yet.</p>
      ) : (
        <ul className="space-y-2">
          {admissions.map((a) => (
            <li key={a.id} className="rounded-md border border-gray-200 text-sm dark:border-gray-800">
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {a.applicantFirstName} {a.applicantLastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.className && `Applying for ${a.className}`} {a.parentName && `· ${a.parentName}`} {a.parentPhone && `· ${a.parentPhone}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[a.status]}`}>{a.status.replace('_', ' ')}</span>
                  <button onClick={() => toggleExpand(a)} className="text-xs text-gray-600 hover:underline dark:text-gray-400">
                    {expandedId === a.id ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>

              {expandedId === a.id && (
                <div className="border-t border-gray-200 p-3 dark:border-gray-800">
                  <PermissionGate code="admissions.manage">
                    {a.status !== 'admitted' && (
                      <div className="mb-4">
                        <p className="mb-1 text-xs font-medium text-gray-500">Move to</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ADMISSION_STATUSES.filter((s) => s !== 'admitted' && s !== a.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(a.id, s)}
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs capitalize hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {a.status !== 'admitted' && (
                      <div className="mb-4">
                        <p className="mb-1 text-xs font-medium text-gray-500">Schedule interview</p>
                        <div className="flex flex-wrap gap-2">
                          <input type="date" className="input max-w-[160px]" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                          <input className="input" placeholder="Notes" value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} />
                          <button onClick={() => handleScheduleInterview(a.id)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                            Save
                          </button>
                        </div>
                        {a.interviewDate && (
                          <p className="mt-1 text-xs text-gray-500">Currently scheduled: {a.interviewDate} {a.interviewNotes && `— ${a.interviewNotes}`}</p>
                        )}
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="mb-1 text-xs font-medium text-gray-500">Documents</p>
                      <div className="mb-2 flex items-center gap-2">
                        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
                        <button onClick={() => handleUploadDocument(a.id)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                          Upload
                        </button>
                      </div>
                      {documents.length === 0 ? (
                        <p className="text-xs text-gray-500">No documents uploaded.</p>
                      ) : (
                        <ul className="space-y-1">
                          {documents.map((d) => (
                            <li key={d.id}>
                              <button onClick={() => handleDownloadDocument(d.filePath)} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                                <Paperclip size={11} /> {d.fileName}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {a.status === 'approved' && (
                      <button onClick={() => handleAdmit(a)} className="rounded-md bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700">
                        Admit as student
                      </button>
                    )}
                    {a.status === 'admitted' && (
                      <p className="text-xs text-green-700 dark:text-green-400">
                        Admitted — converted to a student record.
                      </p>
                    )}
                  </PermissionGate>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdmissionsPage() {
  return (
    <FeatureGate feature="admissions">
      <AdmissionsInner />
    </FeatureGate>
  );
}
