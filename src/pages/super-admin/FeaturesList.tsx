import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createFeature, listFeatures } from '@/services/plans.service';
import type { Feature } from '@/types/plan';
import { getErrorMessage } from '@/lib/errors';

const featureSchema = z.object({
  code: z
    .string()
    .min(2)
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, underscores only'),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
});
type FeatureFields = z.infer<typeof featureSchema>;

export function FeaturesListPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeatureFields>({ resolver: zodResolver(featureSchema) });

  async function load() {
    setLoading(true);
    try {
      setFeatures(await listFeatures());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(values: FeatureFields) {
    setErrorMsg(null);
    try {
      await createFeature(values);
      reset();
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add feature.'));
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-gray-50">Features</h1>
      <p className="mb-6 text-sm text-gray-500">
        The catalog of gate-able modules. Attach features to plans on the Plans page.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 flex flex-wrap items-start gap-2" noValidate>
        <div>
          <input placeholder="code (e.g. custom_module)" className="input" {...register('code')} />
          {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
        </div>
        <div>
          <input placeholder="Display name" className="input" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {features.map((f) => (
            <li key={f.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-50">{f.name}</span>
              <code className="text-xs text-gray-500">{f.code}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
