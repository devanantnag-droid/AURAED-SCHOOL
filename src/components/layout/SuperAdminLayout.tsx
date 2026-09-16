import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, School as SchoolIcon, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { to: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/super-admin/schools', label: 'Schools', icon: SchoolIcon, end: false },
  { to: '/super-admin/plans', label: 'Plans', icon: CreditCard, end: false },
];

export function SuperAdminLayout() {
  const { signOut, profile } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">AURAED SCHOOL</p>
          <p className="text-xs text-gray-500">Super Admin</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
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

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
