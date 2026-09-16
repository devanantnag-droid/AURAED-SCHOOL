import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSchool } from '@/services/schools.service';
import { inviteSchoolAdmin } from '@/services/onboarding.service';
import { supabase } from '@/lib/supabase';
import type { School } from '@/types/school';
import { SchoolSubscriptionPanel } from '@/pages/super-admin/SchoolSubscriptionPanel';
import { getErrorMessage } from '@/lib/errors';

const inviteSchema = z.object({
  fullName: z.string().min(2, 'Enter the admin\u2019s full name'),
  email: z.string().email('Enter a valid email address'),
});
type InviteFields = z.infer<typeof inviteSchema>;

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
}

export function SchoolDetailPage() {
  const { id } = useParams();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFields>({ resolver: zodResolver(inviteSchema) });

  useEffect(() => {
    if (!id) return;
    getSchool(id)
      .then((s) => setSchool(s))
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load school.')))
      .finally(() => setLoading(false));

    supabase
      .from('audit_logs')
      .select('id, action, entity_type, created_at')
      .eq('school_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setAuditRows((data as AuditRow[]) ?? []));
  }, [id]);

  async function onInvite(values: InviteFields) {
    if (!id) return;
    setInviteResult(null);
    setErrorMsg(null);
    try {
      const result = await inviteSchoolAdmin({ schoolId: id, ...values });
      setInviteResult(result.message);
      reset();
    } catch (err) {
      setErrorMsg(
        getErrorMessage(
          err,
          'Failed to invite school admin. Make sure the onboard-school-admin Edge Function is deployed.'
        )
      );
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  if (!school) return <div className="p-6 text-sm text-red-600">{errorMsg || 'School not found.'}</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{school.name}</h1>
          <p className="text-sm text-gray-500">
            {school.code} · {school.email}
          </p>
        </div>
        <Link
          to={`/super-admin/schools/${school.id}/edit`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Edit
        </Link>
      </div>

      <section className="mb-8 rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Invite a School Admin</h2>
        <p className="mb-4 text-sm text-gray-500">
          Creates a login for this person and assigns them the SCHOOL_ADMIN role for {school.name}. They'll
          receive an email to set their password.
        </p>

        <form onSubmit={handleSubmit(onInvite)} className="flex flex-wrap items-start gap-3" noValidate>
          <div>
            <input
              placeholder="Full name"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              {...register('fullName')}
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
          </div>
          <div>
            <input
              placeholder="Email"
              type="email"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send invite'}
          </button>
        </form>

        {inviteResult && (
          <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {inviteResult}
          </p>
        )}
        {errorMsg && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {errorMsg}
          </p>
        )}
      </section>

      <div className="mb-8">
        <SchoolSubscriptionPanel schoolId={school.id} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Recent activity</h2>
        {auditRows.length === 0 ? (
          <p className="text-sm text-gray-500">No activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            {auditRows.map((row) => (
              <li key={row.id} className="flex justify-between px-3 py-2">
                <span className="text-gray-700 dark:text-gray-300">
                  {row.action} · {row.entity_type}
                </span>
                <span className="text-gray-400">{new Date(row.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
