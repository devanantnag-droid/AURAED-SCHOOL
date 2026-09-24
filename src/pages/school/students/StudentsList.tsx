import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { listStudents, setStudentStatus } from '@/services/students.service';
import { invitePortalLogin } from '@/services/portalOnboarding.service';
import { CreateLoginModal } from '@/components/shared/CreateLoginModal';
import { ResetPasswordModal } from '@/components/shared/ResetPasswordModal';
import { adminResetPassword } from '@/services/adminResetPassword.service';
import type { Student } from '@/types/people';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/layout/ConfirmDialog';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  alumni: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

function StudentsListInner() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pendingArchive, setPendingArchive] = useState<Student | null>(null);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  async function load(searchTerm?: string) {
    if (!profile?.schoolId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      setStudents(await listStudents(profile.schoolId, searchTerm));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load students.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function confirmArchive() {
    if (!pendingArchive) return;
    try {
      await setStudentStatus(pendingArchive.id, 'archived');
      setPendingArchive(null);
      load(search);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to archive student.'));
      setPendingArchive(null);
    }
  }

  const [inviteTarget, setInviteTarget] = useState<Student | null>(null);
  const [resetTarget, setResetTarget] = useState<Student | null>(null);

  async function handleResetPassword(password: string) {
    if (!resetTarget?.userId) return;
    setInviteMsg(null);
    try {
      const result = await adminResetPassword(resetTarget.userId, password);
      setInviteMsg(result.message);
      setResetTarget(null);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to reset password.'));
    }
  }

  async function handleCreateLogin(email: string, password: string) {
    if (!inviteTarget) return;
    setInviteMsg(null);
    try {
      const result = await invitePortalLogin('student', inviteTarget.id, email, password);
      setInviteMsg(result.message);
      setInviteTarget(null);
      load(search);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to create portal login.'));
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Students</h1>
          <p className="mt-1 text-sm text-gray-500">{students.length} student(s)</p>
        </div>
        <PermissionGate code="students.create">
          <Link
            to="/school/students/new"
            className="flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus size={16} />
            New student
          </Link>
        </PermissionGate>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or admission number…"
          className="w-full bg-transparent text-sm outline-none dark:text-gray-100"
        />
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}
      {inviteMsg && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {inviteMsg}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <Users className="text-gray-300" size={32} />
          <p className="text-sm text-gray-500">No students yet. Add the first one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Admission #</th>
                <th className="px-4 py-2.5">Class</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3">
                    <Link
                      to={`/school/students/${s.id}`}
                      className="font-medium text-primary-700 hover:underline dark:text-primary-400"
                    >
                      {s.firstName} {s.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.admissionNumber}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {[s.className, s.sectionName].filter(Boolean).join(' - ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <PermissionGate code="students.edit">
                        {!s.userId && (
                          <button onClick={() => setInviteTarget(s)} className="text-sm text-primary-600 hover:underline">
                            Create portal login
                          </button>
                        )}
                        {s.userId && (
                          <button onClick={() => setResetTarget(s)} className="text-sm text-primary-600 hover:underline">
                            Reset password
                          </button>
                        )}
                      </PermissionGate>
                      <PermissionGate code="students.edit">
                        <Link
                          to={`/school/students/${s.id}/edit`}
                          className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                        >
                          Edit
                        </Link>
                      </PermissionGate>
                      <PermissionGate code="students.delete">
                        {s.status !== 'archived' && (
                          <button
                            onClick={() => setPendingArchive(s)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Archive
                          </button>
                        )}
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingArchive}
        title="Archive student?"
        message={`${pendingArchive?.firstName} ${pendingArchive?.lastName}'s records stay intact, but they'll be marked archived and hidden from active lists.`}
        confirmLabel="Archive"
        danger
        onConfirm={confirmArchive}
        onCancel={() => setPendingArchive(null)}
      />

      {inviteTarget && (
        <CreateLoginModal
          personName={`${inviteTarget.firstName} ${inviteTarget.lastName}`}
          defaultEmail={inviteTarget.email ?? ''}
          onSubmit={handleCreateLogin}
          onClose={() => setInviteTarget(null)}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          personName={`${resetTarget.firstName} ${resetTarget.lastName}`}
          onSubmit={handleResetPassword}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

export function StudentsListPage() {
  return (
    <FeatureGate feature="student_management">
      <StudentsListInner />
    </FeatureGate>
  );
}
