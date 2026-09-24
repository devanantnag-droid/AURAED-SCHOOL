import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, School as SchoolIcon, LogOut, CreditCard, LifeBuoy, Megaphone, UserCog, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { NetworkIndicator } from '@/components/mobile/NetworkIndicator';
import { isNativeApp } from '@/lib/platform';
import { MobileShell } from '@/components/mobile/MobileShell';

const navItems = [
  { to: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/super-admin/schools', label: 'Schools', icon: SchoolIcon, end: false },
  { to: '/super-admin/plans', label: 'Plans', icon: CreditCard, end: false },
  { to: '/super-admin/tickets', label: 'Support Tickets', icon: LifeBuoy, end: false },
  { to: '/super-admin/announcements', label: 'Platform Announcements', icon: Megaphone, end: false },
  { to: '/super-admin/account', label: 'Account & Data', icon: UserCog, end: false },
];

export function SuperAdminLayout() {
  const { signOut, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isNativeApp()) {
    return (
      <MobileShell
        homePath="/super-admin"
        notificationsPath="/super-admin/notifications"
        morePath="/super-admin/more"
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper dark:bg-paper-dark">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900 md:relative md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <div>
            <p className="font-serif text-base font-semibold tracking-tight text-primary-800 dark:text-gray-50">AURAED SCHOOL</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
          <div className="flex items-center gap-1">
            <NetworkIndicator />
            <NotificationBell align="left" />
            <button onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden" aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3" onClick={() => setMobileOpen(false)}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-accent-500 bg-primary-50 text-primary-800 dark:border-accent-400 dark:bg-primary-900/40 dark:text-primary-100'
                    : 'border-transparent text-primary-700/70 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <p className="mb-2 truncate px-1 text-xs text-gray-500">{profile?.email}</p>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <p className="font-serif text-sm font-semibold text-primary-800 dark:text-gray-50">AURAED SCHOOL</p>
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
