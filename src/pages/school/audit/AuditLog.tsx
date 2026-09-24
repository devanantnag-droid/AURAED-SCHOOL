import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { getErrorMessage } from '@/lib/errors';
import { listAuditLogs } from '@/services/audit.service';
import type { AuditLogEntry } from '@/types/audit';
import { PageHeader } from '@/components/shared/PageHeader';

const PAGE_SIZE = 25;

const actionStyles: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  UPDATE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

function AuditLogInner() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [entityType, setEntityType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  async function load(pageNum: number) {
    if (!profile?.schoolId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { rows: r, hasMore: hm } = await listAuditLogs(
        profile.schoolId,
        { entityType, fromDate, toDate },
        PAGE_SIZE,
        pageNum * PAGE_SIZE
      );
      setRows(r);
      setHasMore(hm);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load audit log.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(0);
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  function applyFilters() {
    setPage(0);
    load(0);
  }

  function goToPage(p: number) {
    setPage(p);
    load(p);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Audit Log" subtitle="Every tracked create, update, and delete across your school's data — who did it and when." />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="input" placeholder="Filter by type, e.g. students" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
        <input type="date" className="input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" className="input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button onClick={applyFilters} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
          Apply
        </button>
      </div>

      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No matching audit entries.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionStyles[r.action]}`}>{r.action}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-50">{r.entityType}</span>
                  <span className="text-xs text-gray-500">{r.userName ?? 'System'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {new Date(r.createdAt).toLocaleString()}
                  {expandedId === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {expandedId === r.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-3 text-xs dark:border-gray-800 dark:bg-gray-900">
                  {r.oldData && (
                    <div className="mb-2">
                      <p className="mb-1 font-medium text-gray-500">Before</p>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-white p-2 dark:bg-gray-950">{JSON.stringify(r.oldData, null, 2)}</pre>
                    </div>
                  )}
                  {r.newData && (
                    <div>
                      <p className="mb-1 font-medium text-gray-500">After</p>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-white p-2 dark:bg-gray-950">{JSON.stringify(r.newData, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          onClick={() => goToPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Previous
        </button>
        <span className="text-xs text-gray-500">Page {page + 1}</span>
        <button
          onClick={() => goToPage(page + 1)}
          disabled={!hasMore}
          className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function AuditLogPage() {
  return (
    <FeatureGate feature="audit_log">
      <PermissionGate code="audit.view" fallback={<p className="mx-auto max-w-3xl p-6 text-sm text-gray-500">You don't have permission to view the audit log.</p>}>
        <AuditLogInner />
      </PermissionGate>
    </FeatureGate>
  );
}
