import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Briefcase } from 'lucide-react';
import { listStaff, setStaffStatus } from '@/services/staff.service';
import type { StaffMember } from '@/types/people';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/layout/ConfirmDialog';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

function StaffListInner() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pendingArchive, setPendingArchive] = useState<StaffMember | null>(null);

  async function load(searchTerm?: string) {
    if (!profile?.schoolId) return;
    setLoading(true);
    try {
      setStaff(await listStaff(profile.schoolId, searchTerm));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load staff.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function confirmArchive() {
    if (!pendingArchive) return;
    try {
      await setStaffStatus(pendingArchive.id, 'archived');
      setPendingArchive(null);
      load(search);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to archive staff member.'));
      setPendingArchive(null);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Staff</h1>
          <p className="mt-1 text-sm text-gray-500">{staff.length} staff member(s)</p>
        </div>
        <PermissionGate code="staff.create">
          <Link
            to="/school/staff/new"
            className="flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus size={16} />
            New staff
          </Link>
        </PermissionGate>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or employee id…"
          className="w-full bg-transparent text-sm outline-none dark:text-gray-100"
        />
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <Briefcase className="text-gray-300" size={32} />
          <p className="text-sm text-gray-500">No staff yet. Add the first one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Employee ID</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-50">{s.fullName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.employeeId}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.roleTitle || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <PermissionGate code="staff.edit">
                        <Link
                          to={`/school/staff/${s.id}/edit`}
                          className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                        >
                          Edit
                        </Link>
                      </PermissionGate>
                      <PermissionGate code="staff.delete">
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
        title="Archive staff member?"
        message={`${pendingArchive?.fullName}'s records stay intact, but they'll be marked archived.`}
        confirmLabel="Archive"
        danger
        onConfirm={confirmArchive}
        onCancel={() => setPendingArchive(null)}
      />
    </div>
  );
}

export function StaffListPage() {
  return (
    <FeatureGate feature="staff_management">
      <StaffListInner />
    </FeatureGate>
  );
}
