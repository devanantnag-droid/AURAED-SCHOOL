import { useEffect, useState } from 'react';
import { listPlans } from '@/services/plans.service';
import { assignSubscription, getSchoolSubscription, setSubscriptionStatus } from '@/services/subscriptions.service';
import type { Plan, Subscription, SubscriptionStatus } from '@/types/plan';
import { ConfirmDialog } from '@/components/layout/ConfirmDialog';
import { getErrorMessage } from '@/lib/errors';

const statusStyles: Record<string, string> = {
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  expiring: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  expired: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  suspended: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

export function SchoolSubscriptionPanel({ schoolId }: { schoolId: string }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('trial');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<SubscriptionStatus | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [sub, allPlans] = await Promise.all([getSchoolSubscription(schoolId), listPlans()]);
      setSubscription(sub);
      setPlans(allPlans.filter((p) => p.isActive));
      if (sub) {
        setSelectedPlanId(sub.planId);
        setStatus(sub.status);
        setStartDate(sub.startDate);
        setEndDate(sub.endDate ?? '');
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load subscription.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  async function handleAssign() {
    if (!selectedPlanId) {
      setErrorMsg('Choose a plan first.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      await assignSubscription({
        schoolId,
        planId: selectedPlanId,
        status,
        startDate,
        endDate: endDate || null,
      });
      await load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to save subscription.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmStatusChange() {
    if (!pendingStatus) return;
    try {
      await setSubscriptionStatus(schoolId, pendingStatus);
      setPendingStatus(null);
      await load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update status.'));
      setPendingStatus(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading subscription…</p>;

  return (
    <section className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Subscription</h2>
        {subscription && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[subscription.effectiveStatus] ?? ''}`}>
            {subscription.effectiveStatus}
          </span>
        )}
      </div>

      {subscription && (
        <p className="mb-4 text-sm text-gray-500">
          Currently on <strong>{subscription.plan?.name ?? subscription.planId}</strong> · started{' '}
          {subscription.startDate}
          {subscription.endDate && ` · ends ${subscription.endDate}`}
        </p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Plan</label>
          <select className="input" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
            <option value="">Select a plan…</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Start date</label>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">End date (optional)</label>
          <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleAssign}
          disabled={saving}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : subscription ? 'Update subscription' : 'Assign subscription'}
        </button>

        {subscription && subscription.status !== 'suspended' && (
          <button
            onClick={() => setPendingStatus('suspended')}
            className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Suspend
          </button>
        )}
        {subscription && subscription.status === 'suspended' && (
          <button
            onClick={() => setPendingStatus('active')}
            className="rounded-md border border-green-300 px-3 py-2 text-sm text-green-700 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950"
          >
            Reactivate
          </button>
        )}
      </div>

      {errorMsg && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <ConfirmDialog
        open={!!pendingStatus}
        title={pendingStatus === 'suspended' ? 'Suspend subscription?' : 'Reactivate subscription?'}
        message={
          pendingStatus === 'suspended'
            ? 'This school loses access to gated features immediately. Their data is not affected.'
            : 'This school regains access to their plan\u2019s features immediately.'
        }
        confirmLabel={pendingStatus === 'suspended' ? 'Suspend' : 'Reactivate'}
        danger={pendingStatus === 'suspended'}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatus(null)}
      />
    </section>
  );
}
