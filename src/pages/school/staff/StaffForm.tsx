import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createStaff, updateStaff, listStaff } from '@/services/staff.service';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/shared/PageHeader';

const staffSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  roleTitle: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  joiningDate: z.string().optional(),
});
type StaffFields = z.infer<typeof staffSchema>;

export function StaffFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffFields>({ resolver: zodResolver(staffSchema) });

  useEffect(() => {
    if (!isEdit || !id || !profile?.schoolId) return;
    // No single-record getter for staff yet — reuse the list and filter,
    // keeping the service surface small for this phase.
    listStaff(profile.schoolId)
      .then((all) => {
        const s = all.find((x) => x.id === id);
        if (!s) {
          setServerError('Staff member not found.');
          return;
        }
        reset({
          employeeId: s.employeeId,
          fullName: s.fullName,
          roleTitle: s.roleTitle ?? '',
          department: s.department ?? '',
          phone: s.phone ?? '',
          email: s.email ?? '',
          joiningDate: s.joiningDate,
        });
      })
      .catch((err) => setServerError(getErrorMessage(err, 'Failed to load staff member.')))
      .finally(() => setLoadingExisting(false));
  }, [id, isEdit, profile?.schoolId, reset]);

  async function onSubmit(values: StaffFields) {
    if (!profile?.schoolId) return;
    setSubmitting(true);
    setServerError(null);
    try {
      if (isEdit && id) {
        await updateStaff(id, values);
      } else {
        await createStaff(profile.schoolId, values);
      }
      navigate('/school/staff');
    } catch (err) {
      setServerError(getErrorMessage(err, 'Something went wrong.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingExisting) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <PageHeader title={isEdit ? 'Edit staff member' : 'New staff member'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <F label="Full name" error={errors.fullName?.message} required>
            <input className="input" {...register('fullName')} />
          </F>
          <F label="Employee ID" error={errors.employeeId?.message} required>
            <input className="input" {...register('employeeId')} />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Role title">
            <input className="input" placeholder="e.g. Front Desk" {...register('roleTitle')} />
          </F>
          <F label="Department">
            <input className="input" {...register('department')} />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Phone">
            <input className="input" {...register('phone')} />
          </F>
          <F label="Email" error={errors.email?.message}>
            <input className="input" {...register('email')} />
          </F>
        </div>

        <F label="Joining date">
          <input type="date" className="input" {...register('joiningDate')} />
        </F>

        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/school/staff')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add staff member'}
          </button>
        </div>
      </form>
    </div>
  );
}

function F({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
