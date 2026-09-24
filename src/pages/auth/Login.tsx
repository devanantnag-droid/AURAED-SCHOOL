import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { resolveHomeRoute } from '@/config/roleRoutes';
import logo from '@/assets/logo.png';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(error.message);
      setSubmitting(false);
      return;
    }

    await refresh();

    // Fetch roles fresh (refresh() sets context state, but state updates are
    // async — re-fetch the user's roles directly here so we can redirect
    // immediately instead of racing React state).
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', data.user.id);

    const roleNames = (rolesData ?? []).map(
      (r) => (r as unknown as { roles: { name: string } }).roles.name
    ) as Parameters<typeof resolveHomeRoute>[0];

    navigate(resolveHomeRoute(roleNames), { replace: true });
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen bg-paper dark:bg-paper-dark">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-primary-800 px-12 py-14 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-500/10" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 -translate-x-1/3 translate-y-1/3 rounded-full bg-white/5" />

        <div className="flex items-center gap-2">
          <img src={logo} alt="AURAED SCHOOL" className="h-10 w-10 rounded-lg" />
          <p className="font-serif text-2xl font-semibold tracking-tight">AURAED SCHOOL</p>
        </div>

        <div className="max-w-sm">
          <h1 className="font-serif text-4xl font-medium leading-tight text-white">
            The day-to-day of running a school, kept in order.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-100">
            Attendance, fees, report cards, and everything in between — one
            record for every student, teacher, and parent.
          </p>
        </div>

        <p className="text-xs text-primary-300">Sign in with the credentials your school gave you.</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img src={logo} alt="AURAED SCHOOL" className="h-9 w-9 rounded-lg" />
            <p className="font-serif text-xl font-semibold text-primary-800">AURAED SCHOOL</p>
          </div>

          <h2 className="mb-1 text-lg font-semibold text-primary-900 dark:text-gray-50">Sign in</h2>
          <p className="mb-7 text-sm text-gray-500">Enter your email and password to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-primary-800 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-primary-800 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {serverError}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Forgot your password? Ask your school office to reset it for you.
            </p>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Need help signing in? Contact support:{' '}
            <a href="mailto:devanantnag@gmail.com" className="text-primary-700 hover:underline dark:text-primary-300">
              devanantnag@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
