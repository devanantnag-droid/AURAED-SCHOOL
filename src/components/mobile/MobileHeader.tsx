import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NetworkIndicator } from '@/components/mobile/NetworkIndicator';
import { SchoolLogo } from '@/components/shared/SchoolLogo';

// The branded home header - logo, app name, and a line of context
// (school name, or the person's name), used on the main tab screens.
export function MobileHomeHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex min-w-0 items-center gap-2">
        <SchoolLogo className="h-8 w-8 rounded-md object-contain" />
        <div className="min-w-0">
          <p className="font-serif text-sm font-semibold leading-tight text-primary-800 dark:text-gray-50">AURAED SCHOOL</p>
          {subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <NetworkIndicator />
    </header>
  );
}

// A back-button header for anything opened from a tab (a detail screen,
// a specific module) - keeps the person oriented without needing the
// full brand header repeated on every nested screen.
export function MobileDetailHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <p className="truncate text-sm font-semibold text-primary-900 dark:text-gray-50">{title}</p>
      </div>
      <NetworkIndicator />
    </header>
  );
}
