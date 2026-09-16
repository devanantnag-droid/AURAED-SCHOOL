import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSchoolFeature } from '@/hooks/useSchoolFeature';

// Wrap any module's route/section with this once that module exists
// (Phase 5 onward), e.g. <FeatureGate feature="fees"><FeesModule /></FeatureGate>
// Per spec §8: don't silently hide a feature the school lacks — show an
// explicit "Upgrade Plan" message instead.
export function FeatureGate({ feature, children }: { feature: string; children: ReactNode }) {
  const { loading, hasAccess } = useSchoolFeature(feature);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
        <Lock className="text-gray-400" size={28} />
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
          This feature isn't included in your current plan
        </p>
        <p className="max-w-sm text-sm text-gray-500">
          Upgrade your school's subscription to unlock this module.
        </p>
        <Link
          to="/school/subscription"
          className="mt-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          View plans
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
