import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTeacher, getTeacher, updateTeacher } from '@/services/teachers.service';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/shared/PageHeader';

const teacherSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  qualification: z.string().optional(),
  joiningDate: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});
type TeacherFields = z.infer<typeof teacherSchema>;

export function TeacherFormPage() {
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
  } = useForm<TeacherFields>({ resolver: zodResolver(teacherSchema) });

  useEffect(() => {
    if (!isEdit || !id) return;
    getTeacher(id)
      .then((t) => {
        if (!t) {
          setServerError('Teacher not found.');
          return;
        }
        reset({
          employeeId: t.employeeId,
          fullName: t.fullName,
          gender: t.gender ?? undefined,
          dateOfBirth: t.dateOfBirth ?? '',
          phone: t.phone ?? '',
          email: t.email ?? '',
          address: t.address ?? '',
          qualification: t.qualification ?? '',
          joiningDate: t.joiningDate,
          department: t.department ?? '',
          designation: t.designation ?? '',
        });
      })
      .catch((err) => setServerError(getErrorMessage(err, 'Failed to load teacher.')))
      .finally(() => setLoadingExisting(false));
  }, [id, isEdit, reset]);

  async function onSubmit(values: TeacherFields) {
    if (!profile?.schoolId) return;
    setSubmitting(true);
    setServerError(null);
    try {
      if (isEdit && id) {
        await updateTeacher(id, values);
        navigate('/school/teachers');
      } else {
        await createTeacher(profile.schoolId, values);
        navigate('/school/teachers');
      }
    } catch (err) {
      setServerError(getErrorMessage(err, 'Something went wrong.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingExisting) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <PageHeader title={isEdit ? 'Edit teacher' : 'New teacher'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <F label="Full name" error={errors.fullName?.message} required>
            <input className="input" {...register('fullName')} />
          </F>
          <F label="Employee ID" error={errors.employeeId?.message} required>
            <input className="input" {...register('employeeId')} />
          </F>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <F label="Gender">
            <select className="input" {...register('gender')}>
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </F>
          <F label="Date of birth">
            <input type="date" className="input" {...register('dateOfBirth')} />
          </F>
          <F label="Joining date">
            <input type="date" className="input" {...register('joiningDate')} />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Email" error={errors.email?.message}>
            <input className="input" {...register('email')} />
          </F>
          <F label="Phone">
            <input className="input" {...register('phone')} />
          </F>
        </div>

        <F label="Address">
          <input className="input" {...register('address')} />
        </F>

        <div className="grid grid-cols-3 gap-4">
          <F label="Qualification">
            <input className="input" {...register('qualification')} />
          </F>
          <F label="Department">
            <input className="input" {...register('department')} />
          </F>
          <F label="Designation">
            <input className="input" {...register('designation')} />
          </F>
        </div>

        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/school/teachers')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add teacher'}
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
