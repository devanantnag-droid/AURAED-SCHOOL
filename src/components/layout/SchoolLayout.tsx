import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  LogOut,
  Users,
  GraduationCap,
  Contact,
  Briefcase,
  CalendarCheck,
  Fingerprint,
  Settings,
  BookOpen,
  UserCheck,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  Library,
  FileText,
  ListChecks,
  Award,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHasAnyPermission } from '@/hooks/usePermissions';

// Each item's `permission` is the minimum needed to see it at all — actions
// within the page are still individually gated by PermissionGate, this just
// keeps the sidebar itself from listing pages a role has zero access to
// (e.g. a Teacher shouldn't see "Staff" or "Settings" in their nav).
// Items with no `permission` are always shown to anyone in the /school tree.
const navItems: { to: string; label: string; icon: typeof LayoutDashboard; end: boolean; permission?: string[] }[] = [
  { to: '/school/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/school/students', label: 'Students', icon: Users, end: false, permission: ['students.view'] },
  { to: '/school/teachers', label: 'Teachers', icon: GraduationCap, end: false, permission: ['teachers.view'] },
  { to: '/school/parents', label: 'Parents', icon: Contact, end: false, permission: ['parents.view'] },
  { to: '/school/staff', label: 'Staff', icon: Briefcase, end: false, permission: ['staff.view'] },
  { to: '/school/academics', label: 'Academics', icon: BookOpen, end: false, permission: ['academics.view'] },
  { to: '/school/assignments', label: 'Teacher Assignments', icon: UserCheck, end: false, permission: ['academics.view'] },
  { to: '/school/timetable', label: 'Timetable', icon: CalendarClock, end: false, permission: ['academics.view'] },
  { to: '/school/attendance', label: 'Attendance', icon: CalendarCheck, end: false, permission: ['attendance.view'] },
  { to: '/school/teacher-attendance', label: 'Teacher Attendance', icon: Fingerprint, end: false, permission: ['attendance.view'] },
  { to: '/school/homework', label: 'Homework', icon: ClipboardList, end: false, permission: ['homework.view'] },
  { to: '/school/assignments-work', label: 'Assignments', icon: FileCheck2, end: false, permission: ['assignments.view'] },
  { to: '/school/materials', label: 'Study Materials', icon: Library, end: false, permission: ['study_materials.view'] },
  { to: '/school/exams', label: 'Exams', icon: FileText, end: false, permission: ['exams.view'] },
  { to: '/school/marks', label: 'Marks', icon: ListChecks, end: false, permission: ['marks.view'] },
  { to: '/school/report-cards', label: 'Report Cards', icon: Award, end: false, permission: ['marks.view'] },
  { to: '/school/settings', label: 'Settings', icon: Settings, end: false, permission: ['staff.edit'] },
  { to: '/school/subscription', label: 'Subscription', icon: CreditCard, end: false },
];

function NavItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof LayoutDashboard; end: boolean }) {
  return (
    <NavLink
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
  );
}

function GatedNavItem({ item }: { item: (typeof navItems)[number] }) {
  const hasAccess = useHasAnyPermission(item.permission ?? []);
  if (item.permission && !hasAccess) return null;
  return <NavItem {...item} />;
}

export function SchoolLayout() {
  const { signOut, profile } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">AURAED SCHOOL</p>
          <p className="text-xs text-gray-500">{profile?.fullName ?? 'School workspace'}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <GatedNavItem key={item.to} item={item} />
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
