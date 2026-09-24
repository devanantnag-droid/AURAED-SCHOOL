import { useState } from 'react';

interface Props {
  title: string;
  message: string;
  expectedConfirmText: string;
  onConfirm: (confirmText: string) => Promise<void>;
  onClose: () => void;
}

export function DestructiveConfirmModal({ title, message, expectedConfirmText, onConfirm, onClose }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (confirmText !== expectedConfirmText) {
      setErrorMsg(`Type exactly "${expectedConfirmText}" to confirm.`);
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onConfirm(confirmText);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-md bg-white p-5 shadow-lg dark:bg-gray-900">
        <h2 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">{title}</h2>
        <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">{message}</p>

        <label className="mb-1 block text-xs font-medium text-gray-500">
          Type <span className="font-mono font-semibold text-red-700 dark:text-red-400">{expectedConfirmText}</span> to confirm
        </label>
        <input
          className="input w-full"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoFocus
        />

        {errorMsg && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || confirmText !== expectedConfirmText}
            className="rounded-md bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
          >
            {submitting ? 'Deleting…' : 'Permanently delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
