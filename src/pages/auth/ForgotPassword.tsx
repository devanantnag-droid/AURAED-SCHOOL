import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type Fields = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Fields) {
    setSubmitting(true);
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: window.location.origin,
    });
    setSubmitting(false);
    if (error) {
      setServerError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-gray-50">Reset your password</h1>
        <p className="mb-6 text-sm text-gray-500">We'll email you a link to set a new one.</p>

        {sent ? (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input id="email" type="email" autoComplete="email" className="input" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {serverError && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>

            <a href="/login" className="block text-center text-sm text-primary-600 hover:underline">
              Back to sign in
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
