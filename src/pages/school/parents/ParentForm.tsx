import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createParent, getParent, updateParent } from '@/services/parents.service';
import { listStudents } from '@/services/students.service';
import { useAuth } from '@/contexts/AuthContext';
import type { Student } from '@/types/people';
import { getErrorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/shared/PageHeader';

const parentSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  occupation: z.string().optional(),
  childIds: z.array(z.string()).default([]),
});
type ParentFields = z.infer<typeof parentSchema>;

export function ParentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ParentFields>({ resolver: zodResolver(parentSchema), defaultValues: { childIds: [] } });

  useEffect(() => {
    if (profile?.schoolId) listStudents(profile.schoolId).then(setStudents);
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!isEdit || !id) return;
    getParent(id)
      .then((p) => {
        if (!p) {
          setServerError('Parent not found.');
          return;
        }
        reset({
          fullName: p.fullName,
          relationship: p.relationship ?? '',
          phone: p.phone ?? '',
          email: p.email ?? '',
          address: p.address ?? '',
          occupation: p.occupation ?? '',
          childIds: p.childIds,
        });
      })
      .catch((err) => setServerError(getErrorMessage(err, 'Failed to load parent.')))
      .finally(() => setLoadingExisting(false));
  }, [id, isEdit, reset]);

  async function onSubmit(values: ParentFields) {
    if (!profile?.schoolId) return;
    setSubmitting(true);
    setServerError(null);
    try {
      if (isEdit && id) {
        await updateParent(id, values, values.childIds);
      } else {
        await createParent(profile.schoolId, values, values.childIds);
      }
      navigate('/school/parents');
    } catch (err) {
      setServerError(getErrorMessage(err, 'Something went wrong.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingExisting) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <PageHeader title={isEdit ? 'Edit parent' : 'New parent'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <F label="Full name" error={errors.fullName?.message} required>
            <input className="input" {...register('fullName')} />
          </F>
          <F label="Relationship">
            <input className="input" placeholder="e.g. Father" {...register('relationship')} />
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

        <div className="grid grid-cols-2 gap-4">
          <F label="Address">
            <input className="input" {...register('address')} />
          </F>
          <F label="Occupation">
            <input className="input" {...register('occupation')} />
          </F>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Linked children</p>
          {students.length === 0 ? (
            <p className="text-sm text-gray-500">No students in this school yet — add students first.</p>
          ) : (
            <Controller
              control={control}
              name="childIds"
              render={({ field }) => (
                <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-gray-200 p-3 dark:border-gray-800">
                  {students.map((s) => {
                    const checked = field.value.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            field.onChange(
                              e.target.checked
                                ? [...field.value, s.id]
                                : field.value.filter((c) => c !== s.id)
                            );
                          }}
                        />
                        {s.firstName} {s.lastName} ({s.admissionNumber})
                      </label>
                    );
                  })}
                </div>
              )}
            />
          )}
        </div>

        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/school/parents')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add parent'}
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
