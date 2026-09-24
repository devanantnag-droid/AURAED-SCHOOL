import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSchool, getSchool, updateSchool } from '@/services/schools.service';
import { getErrorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/shared/PageHeader';

const schoolSchema = z.object({
  name: z.string().min(2, 'School name is required'),
  code: z
    .string()
    .min(2, 'Code is required')
    .max(20, 'Keep the code under 20 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Only letters, numbers, and hyphens'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().optional(),
  registrationNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  principalName: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
});

type SchoolFormFields = z.infer<typeof schoolSchema>;

const fieldGroups: { label: string; name: keyof SchoolFormFields; required?: boolean }[][] = [
  [
    { label: 'School name', name: 'name', required: true },
    { label: 'School code', name: 'code', required: true },
  ],
  [
    { label: 'Email', name: 'email', required: true },
    { label: 'Phone', name: 'phone' },
  ],
  [
    { label: 'Registration number', name: 'registrationNumber' },
    { label: 'Principal name', name: 'principalName' },
  ],
  [
    { label: 'Address', name: 'address' },
    { label: 'City', name: 'city' },
  ],
  [
    { label: 'State', name: 'state' },
    { label: 'Country', name: 'country' },
  ],
  [
    { label: 'Postal code', name: 'postalCode' },
    { label: 'Website', name: 'website' },
  ],
];

export function SchoolFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchoolFormFields>({ resolver: zodResolver(schoolSchema) });

  useEffect(() => {
    if (!isEdit || !id) return;
    getSchool(id)
      .then((school) => {
        if (!school) {
          setServerError('School not found.');
          return;
        }
        reset({
          name: school.name,
          code: school.code,
          email: school.email,
          phone: school.phone ?? '',
          registrationNumber: school.registrationNumber ?? '',
          address: school.address ?? '',
          city: school.city ?? '',
          state: school.state ?? '',
          country: school.country ?? '',
          postalCode: school.postalCode ?? '',
          principalName: school.principalName ?? '',
          website: school.website ?? '',
          description: school.description ?? '',
        });
      })
      .catch((err) => setServerError(getErrorMessage(err, 'Failed to load school.')))
      .finally(() => setLoadingExisting(false));
  }, [id, isEdit, reset]);

  async function onSubmit(values: SchoolFormFields) {
    setSubmitting(true);
    setServerError(null);
    try {
      if (isEdit && id) {
        await updateSchool(id, values);
        navigate(`/super-admin/schools/${id}`);
      } else {
        const school = await createSchool(values);
        navigate(`/super-admin/schools/${school.id}`);
      }
    } catch (err) {
      setServerError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingExisting) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <PageHeader title={isEdit ? 'Edit school' : 'New school'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {fieldGroups.map((group, i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            {group.map(({ label, name, required }) => (
              <div key={name}>
                <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                  {required && <span className="text-red-500"> *</span>}
                </label>
                <input
                  id={name}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  aria-invalid={!!errors[name]}
                  {...register(name)}
                />
                {errors[name] && (
                  <p className="mt-1 text-xs text-red-600">{errors[name]?.message as string}</p>
                )}
              </div>
            ))}
          </div>
        ))}

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            {...register('description')}
          />
        </div>

        {serverError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create school'}
          </button>
        </div>
      </form>
    </div>
  );
}
