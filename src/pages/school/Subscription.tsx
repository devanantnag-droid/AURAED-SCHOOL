import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolSubscription } from '@/services/subscriptions.service';
import { listPlans } from '@/services/plans.service';
import type { Plan, Subscription } from '@/types/plan';
import { getErrorMessage } from '@/lib/errors';

const statusStyles: Record<string, string> = {
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  expiring: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  expired: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  suspended: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

export function SchoolSubscriptionPage() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [otherPlans, setOtherPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.schoolId) {
      setLoading(false);
      return;
    }
    Promise.all([getSchoolSubscription(profile.schoolId), listPlans()])
      .then(([sub, plans]) => {
        setSubscription(sub);
        setOtherPlans(plans.filter((p) => p.isActive && p.id !== sub?.planId));
      })
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load subscription.')))
      .finally(() => setLoading(false));
  }, [profile?.schoolId]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  if (!subscription) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Subscription</h1>
        <p className="mt-2 text-sm text-gray-500">
          No subscription has been assigned to your school yet. Contact AURAED SCHOOL support.
        </p>
      </div>
    );
  }

  const { plan } = subscription;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-50">Subscription</h1>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <section className="mb-8 rounded-md border border-gray-200 p-5 dark:border-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{plan?.name ?? 'Unknown plan'}</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[subscription.effectiveStatus] ?? ''}`}>
            {subscription.effectiveStatus}
          </span>
        </div>

        {(subscription.effectiveStatus === 'expiring' || subscription.effectiveStatus === 'expired') && (
          <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {subscription.effectiveStatus === 'expired'
              ? 'Your subscription has expired. Your data is safe, but some features may be restricted until you renew.'
              : `Your subscription ends soon (${subscription.endDate}). Contact AURAED SCHOOL to renew.`}
          </p>
        )}
        {subscription.effectiveStatus === 'suspended' && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Your subscription is suspended. Your data is safe. Contact AURAED SCHOOL support to reactivate.
          </p>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-gray-500">Price</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-50">
              {plan?.currency} {plan?.price} / {plan?.billingCycle}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Started</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-50">{subscription.startDate}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Ends</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-50">{subscription.endDate ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Max students</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-50">{plan?.maxStudents ?? 'Unlimited'}</dd>
          </div>
        </dl>
      </section>

      {otherPlans.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Other plans</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {otherPlans.map((p) => (
              <div key={p.id} className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-gray-50">{p.name}</p>
                <p className="mb-2 text-sm text-gray-500">
                  {p.currency} {p.price} / {p.billingCycle}
                </p>
                <p className="text-xs text-gray-500">{p.featureIds.length} feature(s) included</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            To change plans, contact AURAED SCHOOL support — self-service plan changes and online payment arrive
            in a later phase.
          </p>
        </section>
      )}
    </div>
  );
}
