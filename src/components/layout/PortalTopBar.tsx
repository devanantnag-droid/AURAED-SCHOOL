import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { NetworkIndicator } from '@/components/mobile/NetworkIndicator';
import { SchoolLogo } from '@/components/shared/SchoolLogo';

export function PortalTopBar({ title }: { title: string }) {
  const { signOut, profile } = useAuth();

  return (
    <div className="sticky top-0 z-10 -mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-paper px-6 pb-4 pt-6 dark:border-gray-800 dark:bg-paper-dark">
      <div className="flex min-w-0 items-center gap-3">
        <SchoolLogo className="h-9 w-9 flex-shrink-0 rounded-md object-contain" />
        <div className="min-w-0">
          <h1 className="truncate font-serif text-2xl font-medium text-primary-900 dark:text-gray-50">{title}</h1>
          {profile?.fullName && <p className="truncate text-sm text-gray-500">{profile.fullName}</p>}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <NetworkIndicator />
        <NotificationBell />
        <button
          onClick={() => signOut()}
          className="btn-secondary flex items-center gap-1.5 py-1.5"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}
