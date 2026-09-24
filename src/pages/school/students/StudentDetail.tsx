import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStudent, setStudentStatus } from '@/services/students.service';
import { supabase } from '@/lib/supabase';
import type { PersonStatus, Student } from '@/types/people';
import { PageHeader } from '@/components/shared/PageHeader';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { StudentAttendanceSummary } from '@/pages/school/students/StudentAttendanceSummary';
import { StudentFeesSummary } from '@/pages/school/students/StudentFeesSummary';
import { getErrorMessage } from '@/lib/errors';

interface LinkedParent {
  id: string;
  full_name: string;
  relationship: string | null;
  phone: string | null;
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  alumni: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

export function StudentDetailPage() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [parents, setParents] = useState<LinkedParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const s = await getStudent(id);
      setStudent(s);

      const { data: links } = await supabase
        .from('parent_students')
        .select('parents(id, full_name, relationship, phone)')
        .eq('student_id', id);
      setParents(
        (links ?? []).map((l) => (l as unknown as { parents: LinkedParent }).parents).filter(Boolean)
      );
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load student.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusChange(status: PersonStatus) {
    if (!id) return;
    try {
      await setStudentStatus(id, status);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update status.'));
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  if (!student) return <div className="p-6 text-sm text-red-600">{errorMsg || 'Student not found.'}</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader
        title={`${student.firstName} ${student.middleName ?? ''} ${student.lastName}`.replace(/\s+/g, ' ').trim()}
        subtitle={`${student.admissionNumber} · ${[student.className, student.sectionName].filter(Boolean).join(' - ') || 'No class assigned'}`}
        actions={
          <>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[student.status]}`}>
              {student.status}
            </span>
            <PermissionGate code="students.edit">
              <Link
                to={`/school/students/${student.id}/edit`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Edit
              </Link>
            </PermissionGate>
          </>
        }
      />

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <section className="mb-6 grid grid-cols-2 gap-4 rounded-md border border-gray-200 p-4 text-sm dark:border-gray-800 sm:grid-cols-3">
        <Field label="Date of birth" value={student.dateOfBirth} />
        <Field label="Gender" value={student.gender} />
        <Field label="Blood group" value={student.bloodGroup} />
        <Field label="Email" value={student.email} />
        <Field label="Phone" value={student.phone} />
        <Field label="Roll number" value={student.rollNumber} />
        <Field label="House" value={student.house} />
        <Field label="Academic session" value={student.academicSession} />
        <Field label="Admission date" value={student.admissionDate} />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Linked parents/guardians</h2>
        {parents.length === 0 ? (
          <p className="text-sm text-gray-500">No parent linked yet. Link one from the parent's page.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            {parents.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-3 py-2">
                <span>
                  {p.full_name} {p.relationship && <span className="text-gray-500">({p.relationship})</span>}
                </span>
                <span className="text-gray-500">{p.phone}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StudentAttendanceSummary studentId={student.id} />

      <StudentFeesSummary studentId={student.id} studentName={`${student.firstName} ${student.lastName}`} />

      <PermissionGate code="students.delete">
        <section className="flex gap-2">
          {student.status !== 'archived' ? (
            <button
              onClick={() => handleStatusChange('archived')}
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            >
              Archive student
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('active')}
              className="rounded-md border border-green-300 px-3 py-2 text-sm text-green-700 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950"
            >
              Restore to active
            </button>
          )}
        </section>
      </PermissionGate>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 dark:text-gray-50">{value || '—'}</dd>
    </div>
  );
}
