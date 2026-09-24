import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getSchoolGrowthTrend, getSubscriptionBreakdown, getTicketVolumeTrend } from '@/services/analytics.service';
import type { TrendPoint } from '@/services/analytics.service';
import { TrendChartCard } from '@/components/shared/TrendChartCard';
import { isNativeApp } from '@/lib/platform';
import { MobileHomeSuperAdmin } from '@/components/mobile/MobileHomeSuperAdmin';

// Real counts from the `schools` table (RLS lets Super Admin see all rows).
// Subscription/revenue metrics arrive in Phase 3 once plans/subscriptions exist.
export function SuperAdminDashboard() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<{ total: number; active: number } | null>(null);
  const [schoolGrowth, setSchoolGrowth] = useState<TrendPoint[]>([]);
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState<TrendPoint[]>([]);
  const [ticketVolume, setTicketVolume] = useState<TrendPoint[]>([]);

  useEffect(() => {
    supabase
      .from('schools')
      .select('is_active')
      .then(({ data }) => {
        if (!data) return;
        setCounts({
          total: data.length,
          active: data.filter((s) => s.is_active).length,
        });
      });
    getSchoolGrowthTrend().then(setSchoolGrowth).catch(() => {});
    getSubscriptionBreakdown().then(setSubscriptionBreakdown).catch(() => {});
    getTicketVolumeTrend().then(setTicketVolume).catch(() => {});
  }, []);

  if (isNativeApp()) {
    return <MobileHomeSuperAdmin />;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
        Super Admin Dashboard
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Signed in as {profile?.fullName ?? profile?.email}.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500">Total schools</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {counts ? counts.total : '—'}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500">Active schools</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {counts ? counts.active : '—'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <TrendChartCard title="New schools — last 6 months" data={schoolGrowth} type="bar" />
        <TrendChartCard title="Subscriptions by status" data={subscriptionBreakdown} type="bar" />
        <TrendChartCard title="Support tickets — last 14 days" data={ticketVolume} />
      </div>

      <Link
        to="/super-admin/schools"
        className="mt-6 inline-block text-sm text-primary-600 hover:underline"
      >
        Manage schools →
      </Link>
    </div>
  );
}
