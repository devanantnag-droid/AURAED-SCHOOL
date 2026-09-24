import { NavLink, Outlet } from 'react-router-dom';
import { Home, BarChart3, Bell, MessageSquare, Grid3x3, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  homePath: string;
  reportsPath?: string;
  messagesPath?: string;
  notificationsPath: string;
  morePath: string;
}

// Shared by both the School Admin/staff shell and the Super Admin shell —
// only the paths differ between the two, since they're separate route
// trees (/school/* vs /super-admin/*).
export function MobileShell({ homePath, reportsPath, messagesPath, notificationsPath, morePath }: Props) {
  const { signOut } = useAuth();

  const tabs = [
    { to: homePath, label: 'Home', icon: Home, end: true },
    ...(reportsPath ? [{ to: reportsPath, label: 'Reports', icon: BarChart3, end: false }] : []),
    { to: notificationsPath, label: 'Alerts', icon: Bell, end: false },
    ...(messagesPath ? [{ to: messagesPath, label: 'Messages', icon: MessageSquare, end: false }] : []),
    { to: morePath, label: 'More', icon: Grid3x3, end: false },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper dark:bg-paper-dark">
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2">
        <Outlet />
      </main>

      <nav className="flex items-stretch justify-around border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-900">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <tab.icon size={20} />
            {tab.label}
          </NavLink>
        ))}
        <button
          onClick={() => signOut()}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-gray-500 dark:text-gray-400"
        >
          <LogOut size={20} />
          Sign out
        </button>
      </nav>
    </div>
  );
}
