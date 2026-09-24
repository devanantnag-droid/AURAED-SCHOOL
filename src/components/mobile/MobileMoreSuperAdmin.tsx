import { Link } from 'react-router-dom';
import { School as SchoolIcon, CreditCard, LifeBuoy, Megaphone, UserCog } from 'lucide-react';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';

const tiles = [
  { to: '/super-admin/schools', label: 'Schools', icon: SchoolIcon },
  { to: '/super-admin/plans', label: 'Plans', icon: CreditCard },
  { to: '/super-admin/tickets', label: 'Support Tickets', icon: LifeBuoy },
  { to: '/super-admin/announcements', label: 'Platform Announcements', icon: Megaphone },
  { to: '/super-admin/account', label: 'Account & Data', icon: UserCog },
];

export function MobileMoreSuperAdmin() {
  return (
    <div>
      <MobileDetailHeader title="More" />
      <div className="grid grid-cols-3 gap-3 p-4">
        {tiles.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              <tile.icon size={20} />
            </span>
            <span className="text-xs font-medium leading-tight text-gray-700 dark:text-gray-300">{tile.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
