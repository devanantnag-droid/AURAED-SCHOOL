import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export function IconGridTile({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
        <Icon size={20} />
      </span>
      <span className="text-xs font-medium leading-tight text-gray-700 dark:text-gray-300">{label}</span>
    </Link>
  );
}

export function SummaryCard({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-primary-900 dark:text-gray-50">{value ?? '—'}</p>
    </div>
  );
}
