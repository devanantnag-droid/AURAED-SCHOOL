import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { resolveHomeRoute } from '@/config/roleRoutes';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type Fields = z.infer<typeof schema>;

// Reached when Supabase redirects here after an invite or password-reset
// link — it lands on the app's Site URL with an access token in the URL
// hash, which supabase-js's detectSessionInUrl already exchanged for a
// real session by the time this renders. This page's only job is to let
// that now-authenticated-but-passwordless user actually set a password.
export function SetPasswordPage() {
  const navigate = useNavigate();
  const { refresh, roles } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Fields) {
    setSubmitting(true);
    setServerError(null);

    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      setServerError(error.message);
      setSubmitting(false);
      return;
    }

    await refresh();
    sessionStorage.removeItem('auraed_auth_flow');
    // roles from context may not have updated synchronously — re-fetch directly.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const { data: rolesData } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id);
    const roleNames = (rolesData ?? []).map(
      (r) => (r as unknown as { roles: { name: string } }).roles.name
    ) as Parameters<typeof resolveHomeRoute>[0];

    navigate(resolveHomeRoute(roleNames.length ? roleNames : roles.map((r) => r.roleName)), { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-gray-50">Set your password</h1>
        <p className="mb-6 text-sm text-gray-500">Choose a password to finish setting up your account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="input"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="input"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
