import { useState } from 'react';

interface Props {
  personName: string;
  defaultEmail?: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  onClose: () => void;
}

export function CreateLoginModal({ personName, defaultEmail, onSubmit, onClose }: Props) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Enter an email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-md bg-white p-5 shadow-lg dark:bg-gray-900">
        <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-50">Create login for {personName}</h2>
        <p className="mb-4 text-xs text-gray-500">
          This account works immediately with the password you set here — no invite email is sent. Share
          these credentials with {personName} directly.
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
            <input
              type="email"
              className="input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Password</label>
            <input type="text" className="input w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Confirm password</label>
            <input type="text" className="input w-full" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>

        {errorMsg && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  );
}
