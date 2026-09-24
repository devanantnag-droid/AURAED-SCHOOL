import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { getMyChildren } from '@/services/portal.service';
import { PortalChildView } from '@/pages/portal/PortalChildView';
import { PortalTopBar } from '@/components/layout/PortalTopBar';
import type { PortalChild } from '@/services/portal.service';
import { isNativeApp } from '@/lib/platform';
import { MobileParentShell } from '@/components/mobile/MobileParentShell';

export function ParentDashboard() {
  if (isNativeApp()) {
    return <MobileParentShell />;
  }

  const { profile } = useAuth();
  const [children, setChildren] = useState<PortalChild[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setErrorMsg(null);
      try {
        const kids = await getMyChildren();
        setChildren(kids);
        if (kids.length > 0) setSelectedId(kids[0].id);
        if (kids.length === 0) {
          setErrorMsg('No children are linked to your account yet — ask your School Admin to link you as a parent.');
        }
      } catch (err) {
        setErrorMsg(getErrorMessage(err, 'Failed to load your children.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <PortalTopBar title="Parent Dashboard" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  const selected = children.find((c) => c.id === selectedId);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PortalTopBar title="Parent Dashboard" />

      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      {children.length > 1 && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">Viewing</label>
          <select className="input max-w-xs" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
      )}

      {selected && profile?.schoolId && (
        <PortalChildView
          schoolId={profile.schoolId}
          studentId={selected.id}
          studentName={`${selected.firstName} ${selected.lastName}`}
          className={selected.className}
          sectionName={selected.sectionName}
        />
      )}
    </div>
  );
}
