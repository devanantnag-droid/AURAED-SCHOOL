import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Contact } from 'lucide-react';
import { listParents } from '@/services/parents.service';
import type { Parent } from '@/types/people';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';

function ParentsListInner() {
  const { profile } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function load(searchTerm?: string) {
    if (!profile?.schoolId) return;
    setLoading(true);
    try {
      setParents(await listParents(profile.schoolId, searchTerm));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load parents.'));
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Parents</h1>
          <p className="mt-1 text-sm text-gray-500">{parents.length} parent(s)</p>
        </div>
        <PermissionGate code="parents.create">
          <Link
            to="/school/parents/new"
            className="flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus size={16} />
            New parent
          </Link>
        </PermissionGate>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
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
      ) : parents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <Contact className="text-gray-300" size={32} />
          <p className="text-sm text-gray-500">No parents yet. Add the first one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Relationship</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">Children linked</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {parents.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-50">{p.fullName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.relationship || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.childIds.length}</td>
                  <td className="px-4 py-3 text-right">
                    <PermissionGate code="parents.edit">
                      <Link
                        to={`/school/parents/${p.id}/edit`}
                        className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                      >
                        Edit
                      </Link>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ParentsListPage() {
  return (
    <FeatureGate feature="parent_management">
      <ParentsListInner />
    </FeatureGate>
  );
}
