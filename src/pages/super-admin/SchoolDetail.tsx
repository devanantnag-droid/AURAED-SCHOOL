import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSchool } from '@/services/schools.service';
import { inviteSchoolAdmin } from '@/services/onboarding.service';
import { adminResetPassword } from '@/services/adminResetPassword.service';
import { ResetPasswordModal } from '@/components/shared/ResetPasswordModal';
import { DestructiveConfirmModal } from '@/components/shared/DestructiveConfirmModal';
import { superAdminDelete } from '@/services/superAdminDelete.service';
import { supabase } from '@/lib/supabase';
import type { School } from '@/types/school';
import { SchoolSubscriptionPanel } from '@/pages/super-admin/SchoolSubscriptionPanel';
import { getErrorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/shared/PageHeader';

const inviteSchema = z.object({
  fullName: z.string().min(2, 'Enter the admin\u2019s full name'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type InviteFields = z.infer<typeof inviteSchema>;

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
}

interface SchoolAdminRow {
  userId: string;
  fullName: string;
  email: string;
}

export function SchoolDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [schoolAdmins, setSchoolAdmins] = useState<SchoolAdminRow[]>([]);
  const [resetTarget, setResetTarget] = useState<SchoolAdminRow | null>(null);
  const [showDeleteSchool, setShowDeleteSchool] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFields>({ resolver: zodResolver(inviteSchema) });

  async function loadSchoolAdmins() {
    if (!id) return;
    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('user_id, roles!inner(name)')
      .eq('school_id', id)
      .eq('roles.name', 'SCHOOL_ADMIN');

    const userIds = (roleRows ?? []).map((r) => r.user_id);
    if (userIds.length === 0) {
      setSchoolAdmins([]);
      return;
    }

    const { data: profileRows } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
    const profilesById = new Map((profileRows ?? []).map((p) => [p.id, p]));

    setSchoolAdmins(
      userIds.map((userId) => ({
        userId,
        fullName: profilesById.get(userId)?.full_name ?? 'Unknown',
        email: profilesById.get(userId)?.email ?? '',
      }))
    );
  }

  useEffect(() => {
    if (!id) return;
    getSchool(id)
      .then((s) => setSchool(s))
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load school.')))
      .finally(() => setLoading(false));

    loadSchoolAdmins();

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
      loadSchoolAdmins();
    } catch (err) {
      setErrorMsg(
        getErrorMessage(
          err,
          'Failed to invite school admin. Make sure the onboard-school-admin Edge Function is deployed.'
        )
      );
    }
  }

  async function handleResetPassword(password: string) {
    if (!resetTarget) return;
    setInviteResult(null);
    setErrorMsg(null);
    try {
      const result = await adminResetPassword(resetTarget.userId, password);
      setInviteResult(result.message);
      setResetTarget(null);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to reset password.'));
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  if (!school) return <div className="p-6 text-sm text-red-600">{errorMsg || 'School not found.'}</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader
        title={school.name}
        subtitle={`${school.code} · ${school.email}`}
        actions={
          <>
            <Link
              to={`/super-admin/schools/${school.id}/edit`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteSchool(true)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              Delete school
            </button>
          </>
        }
      />

      <section className="mb-8 rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Create a School Admin</h2>
        <p className="mb-4 text-sm text-gray-500">
          Creates a login for this person and assigns them the SCHOOL_ADMIN role for {school.name}. The
          account works immediately with the password you set here — share it with them directly.
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
          <div>
            <input
              placeholder="Password"
              type="text"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating…' : 'Create account'}
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

        {schoolAdmins.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Current School Admins</h3>
            <ul className="space-y-1">
              {schoolAdmins.map((a) => (
                <li key={a.userId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{a.fullName} <span className="text-gray-400">· {a.email}</span></span>
                  <button onClick={() => setResetTarget(a)} className="text-primary-600 hover:underline">
                    Reset password
                  </button>
                </li>
              ))}
            </ul>
          </div>
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

      {resetTarget && (
        <ResetPasswordModal
          personName={resetTarget.fullName}
          onSubmit={handleResetPassword}
          onClose={() => setResetTarget(null)}
        />
      )}

      {showDeleteSchool && school && (
        <DestructiveConfirmModal
          title={`Permanently delete ${school.name}?`}
          message="This deletes every student, teacher, parent, staff, and admin account at this school, along with all attendance, fees, marks, and every other record. This cannot be undone."
          expectedConfirmText={school.code}
          onClose={() => setShowDeleteSchool(false)}
          onConfirm={async (confirmText) => {
            setErrorMsg(null);
            try {
              const result = await superAdminDelete('school', school.id, confirmText, school.code);
              if (result.success) {
                navigate('/super-admin/schools');
              } else {
                setErrorMsg(result.message);
              }
            } catch (err) {
              setErrorMsg(getErrorMessage(err, 'Failed to delete school.'));
            }
          }}
        />
      )}
    </div>
  );
}
