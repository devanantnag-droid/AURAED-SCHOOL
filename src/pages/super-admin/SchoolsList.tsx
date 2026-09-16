import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, School as SchoolIcon } from 'lucide-react';
import { listSchools, setSchoolActive } from '@/services/schools.service';
import type { School } from '@/types/school';
import { ConfirmDialog } from '@/components/layout/ConfirmDialog';
import { getErrorMessage } from '@/lib/errors';

export function SchoolsListPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pendingToggle, setPendingToggle] = useState<School | null>(null);

  async function load(searchTerm?: string) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await listSchools(searchTerm);
      setSchools(data);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load schools.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300); // debounced search
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function confirmToggle() {
    if (!pendingToggle) return;
    try {
      await setSchoolActive(pendingToggle.id, !pendingToggle.isActive);
      setPendingToggle(null);
      load(search);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update school status.'));
      setPendingToggle(null);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Schools</h1>
          <p className="mt-1 text-sm text-gray-500">{schools.length} school(s)</p>
        </div>
        <Link
          to="/super-admin/schools/new"
          className="flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          New school
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code…"
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
      ) : schools.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <SchoolIcon className="text-gray-300" size={32} />
          <p className="text-sm text-gray-500">No schools yet. Create the first one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {schools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3">
                    <Link
                      to={`/super-admin/schools/${school.id}`}
                      className="font-medium text-primary-700 hover:underline dark:text-primary-400"
                    >
                      {school.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{school.code}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{school.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        school.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {school.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/super-admin/schools/${school.id}/edit`}
                        className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setPendingToggle(school)}
                        className={`text-sm hover:underline ${
                          school.isActive ? 'text-red-600' : 'text-green-700'
                        }`}
                      >
                        {school.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingToggle}
        title={pendingToggle?.isActive ? 'Suspend school?' : 'Reactivate school?'}
        message={
          pendingToggle?.isActive
            ? `${pendingToggle?.name}'s data stays intact, but its users will lose access until reactivated.`
            : `${pendingToggle?.name}'s users will regain access immediately.`
        }
        confirmLabel={pendingToggle?.isActive ? 'Suspend' : 'Reactivate'}
        danger={!!pendingToggle?.isActive}
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}
