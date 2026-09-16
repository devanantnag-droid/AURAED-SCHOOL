import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Copy } from 'lucide-react';
import { listPlans, setPlanActive, duplicatePlan } from '@/services/plans.service';
import type { Plan } from '@/types/plan';
import { ConfirmDialog } from '@/components/layout/ConfirmDialog';
import { getErrorMessage } from '@/lib/errors';

export function PlansListPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Plan | null>(null);

  async function load() {
    setLoading(true);
    try {
      setPlans(await listPlans());
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load plans.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function confirmToggle() {
    if (!pendingToggle) return;
    try {
      await setPlanActive(pendingToggle.id, !pendingToggle.isActive);
      setPendingToggle(null);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update plan status.'));
      setPendingToggle(null);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicatePlan(id);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to duplicate plan.'));
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Plans</h1>
          <p className="mt-1 text-sm text-gray-500">{plans.length} plan(s)</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/super-admin/features"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Manage features
          </Link>
          <Link
            to="/super-admin/plans/new"
            className="flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus size={16} />
            New plan
          </Link>
        </div>
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 py-16 text-center text-sm text-gray-500 dark:border-gray-700">
          No plans yet. Create the first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-md border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{plan.name}</p>
                  <p className="text-xs text-gray-500">{plan.slug}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    plan.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                {plan.currency} {plan.price}
                <span className="text-xs font-normal text-gray-500"> / {plan.billingCycle}</span>
              </p>

              <ul className="mb-4 flex-1 space-y-1 text-xs text-gray-500">
                <li>Trial: {plan.trialDays} days</li>
                <li>Max students: {plan.maxStudents ?? 'Unlimited'}</li>
                <li>Max teachers: {plan.maxTeachers ?? 'Unlimited'}</li>
                <li>{plan.featureIds.length} feature(s) included</li>
              </ul>

              <div className="flex items-center gap-3 text-sm">
                <Link to={`/super-admin/plans/${plan.id}/edit`} className="text-primary-700 hover:underline dark:text-primary-400">
                  Edit
                </Link>
                <button
                  onClick={() => handleDuplicate(plan.id)}
                  className="flex items-center gap-1 text-gray-600 hover:underline dark:text-gray-400"
                >
                  <Copy size={13} /> Duplicate
                </button>
                <button
                  onClick={() => setPendingToggle(plan)}
                  className={`ml-auto hover:underline ${plan.isActive ? 'text-red-600' : 'text-green-700'}`}
                >
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingToggle}
        title={pendingToggle?.isActive ? 'Deactivate plan?' : 'Activate plan?'}
        message={
          pendingToggle?.isActive
            ? `Schools already on ${pendingToggle?.name} keep their subscription. New schools won't be able to select it.`
            : `${pendingToggle?.name} becomes selectable for new subscriptions again.`
        }
        confirmLabel={pendingToggle?.isActive ? 'Deactivate' : 'Activate'}
        danger={!!pendingToggle?.isActive}
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}
