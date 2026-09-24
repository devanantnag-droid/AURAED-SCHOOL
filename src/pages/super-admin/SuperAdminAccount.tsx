import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';
import { listSchools } from '@/services/schools.service';
import { listTeachers } from '@/services/teachers.service';
import { listStudents } from '@/services/students.service';
import { listStaff } from '@/services/staff.service';
import { listParents } from '@/services/parents.service';
import { createSuperAdmin } from '@/services/createSuperAdmin.service';
import { superAdminDelete } from '@/services/superAdminDelete.service';
import type { DeletableEntityType } from '@/services/superAdminDelete.service';
import { DestructiveConfirmModal } from '@/components/shared/DestructiveConfirmModal';
import type { School } from '@/types/school';
import { PageHeader } from '@/components/shared/PageHeader';

type PersonTab = 'teacher' | 'student' | 'staff' | 'parent';

interface PersonRow {
  id: string;
  name: string;
}

export function SuperAdminAccountPage() {
  // --- Change my own password ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  async function handleChangeOwnPassword() {
    setPasswordMsg(null);
    setPasswordErr(null);
    if (newPassword.length < 8) {
      setPasswordErr('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('Passwords do not match.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordErr(error.message);
    } else {
      setPasswordMsg('Your password has been updated.');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  // --- Create another Super Admin ---
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreateSuperAdmin() {
    setCreateMsg(null);
    setCreateErr(null);
    setCreating(true);
    try {
      const result = await createSuperAdmin(newFullName, newEmail, newAdminPassword);
      if (result.success) {
        setCreateMsg(result.message);
        setNewFullName('');
        setNewEmail('');
        setNewAdminPassword('');
      } else {
        setCreateErr(result.message);
      }
    } catch (err) {
      setCreateErr(getErrorMessage(err, 'Failed to create account.'));
    } finally {
      setCreating(false);
    }
  }

  // --- Broad delete panel ---
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [personTab, setPersonTab] = useState<PersonTab>('teacher');
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: DeletableEntityType; id: string; name: string } | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  useEffect(() => {
    listSchools().then(setSchools);
  }, []);

  async function loadPeople() {
    if (!selectedSchoolId) return;
    setDeleteErr(null);
    try {
      if (personTab === 'teacher') {
        setPeople((await listTeachers(selectedSchoolId)).map((t) => ({ id: t.id, name: t.fullName })));
      } else if (personTab === 'student') {
        setPeople((await listStudents(selectedSchoolId)).map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));
      } else if (personTab === 'staff') {
        setPeople((await listStaff(selectedSchoolId)).map((s) => ({ id: s.id, name: s.fullName })));
      } else {
        setPeople((await listParents(selectedSchoolId)).map((p) => ({ id: p.id, name: p.fullName })));
      }
    } catch (err) {
      setDeleteErr(getErrorMessage(err, 'Failed to load records.'));
    }
  }

  useEffect(() => {
    loadPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchoolId, personTab]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Account & Data Management" subtitle="Your own account, additional Super Admin accounts, and permanent record deletion across any school." />
      <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-3 text-sm font-semibold text-primary-900 dark:text-gray-50">Change my password</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <input type="text" className="input" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input type="text" className="input" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        {passwordMsg && <p className="mb-2 text-sm text-green-700 dark:text-green-400">{passwordMsg}</p>}
        {passwordErr && <p className="mb-2 text-sm text-red-600">{passwordErr}</p>}
        <button onClick={handleChangeOwnPassword} className="btn-primary">Update password</button>
      </section>

      <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-3 text-sm font-semibold text-primary-900 dark:text-gray-50">Create another Super Admin</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="input" placeholder="Full name" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />
          <input className="input" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <input type="text" className="input" placeholder="Password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} />
        </div>
        {createMsg && <p className="mb-2 text-sm text-green-700 dark:text-green-400">{createMsg}</p>}
        {createErr && <p className="mb-2 text-sm text-red-600">{createErr}</p>}
        <button onClick={handleCreateSuperAdmin} disabled={creating} className="btn-primary">
          {creating ? 'Creating…' : 'Create account'}
        </button>
      </section>

      <section className="rounded-md border border-red-200 p-4 dark:border-red-900">
        <h2 className="mb-1 text-sm font-semibold text-red-700 dark:text-red-400">Permanent record deletion</h2>
        <p className="mb-3 text-xs text-gray-500">Pick a school, then a category, to permanently delete an individual record — including its login, if any. This cannot be undone.</p>

        {deleteErr && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{deleteErr}</p>}

        <div className="mb-3 flex flex-wrap gap-2">
          <select className="input" value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)}>
            <option value="">Select a school…</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {(['teacher', 'student', 'staff', 'parent'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPersonTab(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                personTab === t ? 'bg-primary-700 text-white' : 'border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>

        {!selectedSchoolId ? (
          <p className="text-sm text-gray-500">Select a school to see its records.</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-gray-500">No {personTab}s at this school.</p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {people.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-800">
                <span>{p.name}</span>
                <button
                  onClick={() => setDeleteTarget({ type: personTab, id: p.id, name: p.name })}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {deleteTarget && (
        <DestructiveConfirmModal
          title={`Permanently delete ${deleteTarget.name}?`}
          message="This deletes their login (if any) and every record tied to them — attendance, marks, fees, and everything else. This cannot be undone."
          expectedConfirmText="DELETE"
          onClose={() => setDeleteTarget(null)}
          onConfirm={async (confirmText) => {
            setDeleteErr(null);
            try {
              const result = await superAdminDelete(deleteTarget.type, deleteTarget.id, confirmText, 'DELETE');
              if (result.success) {
                setDeleteTarget(null);
                loadPeople();
              } else {
                setDeleteErr(result.message);
              }
            } catch (err) {
              setDeleteErr(getErrorMessage(err, 'Failed to delete.'));
            }
          }}
        />
      )}
    </div>
  );
}
