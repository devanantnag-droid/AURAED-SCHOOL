import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPlan, getPlan, listFeatures, updatePlan } from '@/services/plans.service';
import type { Feature } from '@/types/plan';
import { getErrorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/shared/PageHeader';

const planSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  currency: z.string().min(1),
  billingCycle: z.enum(['monthly', 'yearly']),
  trialDays: z.coerce.number().min(0),
  maxStudents: z.coerce.number().optional(),
  maxTeachers: z.coerce.number().optional(),
  maxStaff: z.coerce.number().optional(),
  storageLimitMb: z.coerce.number().optional(),
  featureIds: z.array(z.string()).default([]),
});
type PlanFields = z.infer<typeof planSchema>;

export function PlanFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PlanFields>({
    resolver: zodResolver(planSchema),
    defaultValues: { currency: 'INR', billingCycle: 'monthly', trialDays: 14, featureIds: [] },
  });

  useEffect(() => {
    listFeatures().then(setFeatures);
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    getPlan(id)
      .then((plan) => {
        if (!plan) {
          setServerError('Plan not found.');
          return;
        }
        reset({
          name: plan.name,
          slug: plan.slug,
          description: plan.description ?? '',
          price: plan.price,
          currency: plan.currency,
          billingCycle: plan.billingCycle,
          trialDays: plan.trialDays,
          maxStudents: plan.maxStudents ?? undefined,
          maxTeachers: plan.maxTeachers ?? undefined,
          maxStaff: plan.maxStaff ?? undefined,
          storageLimitMb: plan.storageLimitMb ?? undefined,
          featureIds: plan.featureIds,
        });
      })
      .catch((err) => setServerError(getErrorMessage(err, 'Failed to load plan.')))
      .finally(() => setLoadingExisting(false));
  }, [id, isEdit, reset]);

  async function onSubmit(values: PlanFields) {
    setSubmitting(true);
    setServerError(null);
    try {
      if (isEdit && id) {
        await updatePlan(id, values);
      } else {
        await createPlan(values);
      }
      navigate('/super-admin/plans');
    } catch (err) {
      setServerError(getErrorMessage(err, 'Something went wrong.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingExisting) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <PageHeader title={isEdit ? 'Edit plan' : 'New plan'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Plan name" error={errors.name?.message}>
            <input className="input" {...register('name')} />
          </Field>
          <Field label="Slug" error={errors.slug?.message}>
            <input className="input" placeholder="e.g. standard" {...register('slug')} />
          </Field>
        </div>

        <Field label="Description">
          <textarea rows={2} className="input" {...register('description')} />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Price" error={errors.price?.message}>
            <input type="number" step="0.01" className="input" {...register('price')} />
          </Field>
          <Field label="Currency">
            <input className="input" {...register('currency')} />
          </Field>
          <Field label="Billing cycle">
            <select className="input" {...register('billingCycle')}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Field label="Trial days">
            <input type="number" className="input" {...register('trialDays')} />
          </Field>
          <Field label="Max students">
            <input type="number" className="input" placeholder="Unlimited" {...register('maxStudents')} />
          </Field>
          <Field label="Max teachers">
            <input type="number" className="input" placeholder="Unlimited" {...register('maxTeachers')} />
          </Field>
          <Field label="Max staff">
            <input type="number" className="input" placeholder="Unlimited" {...register('maxStaff')} />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Included features</p>
          <Controller
            control={control}
            name="featureIds"
            render={({ field }) => (
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-gray-200 p-3 dark:border-gray-800">
                {features.map((feature) => {
                  const checked = field.value.includes(feature.id);
                  return (
                    <label key={feature.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          field.onChange(
                            e.target.checked
                              ? [...field.value, feature.id]
                              : field.value.filter((f) => f !== feature.id)
                          );
                        }}
                      />
                      {feature.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </div>

        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/super-admin/plans')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create plan'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
