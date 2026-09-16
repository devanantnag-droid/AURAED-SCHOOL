import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createStudent, getStudent, updateStudent } from '@/services/students.service';
import { listClasses, listSections } from '@/services/academics.service';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import type { ClassEntity, Section } from '@/types/academics';

const studentSchema = z.object({
  admissionNumber: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  admissionDate: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  rollNumber: z.string().optional(),
  academicSession: z.string().optional(),
  house: z.string().optional(),
});
type StudentFields = z.infer<typeof studentSchema>;

export function StudentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<StudentFields>({ resolver: zodResolver(studentSchema) });

  const selectedClassId = watch('classId');

  useEffect(() => {
    if (profile?.schoolId) listClasses(profile.schoolId).then(setClasses);
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !selectedClassId) {
      setSections([]);
      return;
    }
    listSections(profile.schoolId, selectedClassId).then(setSections);
  }, [profile?.schoolId, selectedClassId]);

  useEffect(() => {
    if (!isEdit || !id) return;
    getStudent(id)
      .then((s) => {
        if (!s) {
          setServerError('Student not found.');
          return;
        }
        reset({
          admissionNumber: s.admissionNumber,
          firstName: s.firstName,
          middleName: s.middleName ?? '',
          lastName: s.lastName,
          dateOfBirth: s.dateOfBirth ?? '',
          gender: s.gender ?? undefined,
          bloodGroup: s.bloodGroup ?? '',
          email: s.email ?? '',
          phone: s.phone ?? '',
          address: s.address ?? '',
          city: s.city ?? '',
          state: s.state ?? '',
          postalCode: s.postalCode ?? '',
          admissionDate: s.admissionDate,
          classId: s.classId ?? '',
          sectionId: s.sectionId ?? '',
          rollNumber: s.rollNumber ?? '',
          academicSession: s.academicSession ?? '',
          house: s.house ?? '',
        });
      })
      .catch((err) => setServerError(getErrorMessage(err, 'Failed to load student.')))
      .finally(() => setLoadingExisting(false));
  }, [id, isEdit, reset]);

  async function onSubmit(values: StudentFields) {
    if (!profile?.schoolId) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = { ...values, classId: values.classId || null, sectionId: values.sectionId || null };
      if (isEdit && id) {
        await updateStudent(id, payload);
        navigate(`/school/students/${id}`);
      } else {
        const student = await createStudent(profile.schoolId, payload);
        navigate(`/school/students/${student.id}`);
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
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-50">
        {isEdit ? 'Edit student' : 'New student'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-3 gap-4">
          <F label="First name" error={errors.firstName?.message} required>
            <input className="input" {...register('firstName')} />
          </F>
          <F label="Middle name">
            <input className="input" {...register('middleName')} />
          </F>
          <F label="Last name" error={errors.lastName?.message} required>
            <input className="input" {...register('lastName')} />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Admission number" error={errors.admissionNumber?.message} required>
            <input className="input" {...register('admissionNumber')} />
          </F>
          <F label="Admission date">
            <input type="date" className="input" {...register('admissionDate')} />
          </F>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <F label="Date of birth">
            <input type="date" className="input" {...register('dateOfBirth')} />
          </F>
          <F label="Gender">
            <select className="input" {...register('gender')}>
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </F>
          <F label="Blood group">
            <input className="input" placeholder="e.g. O+" {...register('bloodGroup')} />
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

        <div className="grid grid-cols-3 gap-4">
          <F label="Address">
            <input className="input" {...register('address')} />
          </F>
          <F label="City">
            <input className="input" {...register('city')} />
          </F>
          <F label="State">
            <input className="input" {...register('state')} />
          </F>
        </div>

        {classes.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-700">
            No classes set up yet.{' '}
            <Link to="/school/academics" className="text-primary-600 hover:underline">
              Create classes and sections
            </Link>{' '}
            first, then come back to assign this student.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <F label="Class">
              <Controller
                control={control}
                name="classId"
                render={({ field }) => (
                  <select className="input" {...field}>
                    <option value="">—</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </F>
            <F label="Section">
              <Controller
                control={control}
                name="sectionId"
                render={({ field }) => (
                  <select className="input" {...field} disabled={!selectedClassId}>
                    <option value="">—</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </F>
            <F label="Roll number">
              <input className="input" {...register('rollNumber')} />
            </F>
            <F label="House">
              <input className="input" {...register('house')} />
            </F>
          </div>
        )}

        <F label="Academic session">
          <input className="input" placeholder="e.g. 2026-2027" {...register('academicSession')} />
        </F>

        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
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
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
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
