import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { NetworkIndicator } from '@/components/mobile/NetworkIndicator';
import { SchoolLogo } from '@/components/shared/SchoolLogo';
import { isNativeApp } from '@/lib/platform';
import { MobileShell } from '@/components/mobile/MobileShell';
import {
  LayoutDashboard,
  CreditCard,
  LogOut,
  Menu,
  X,
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
  Wallet,
  Landmark,
  Banknote,
  BookMarked,
  Bus,
  Package,
  UserPlus,
  IdCard,
  MessageSquare,
  CalendarDays,
  CalendarRange,
  FileBarChart,
  ScrollText,
  LifeBuoy,
  HeartHandshake,
  CalendarOff,
  FileStack,
  Armchair,
  MessageSquareText,
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
  { to: '/school/exam-seating', label: 'Exam Seating', icon: Armchair, end: false, permission: ['exam_seating.manage'] },
  { to: '/school/fees', label: 'Fees', icon: Wallet, end: false, permission: ['fees.view'] },
  { to: '/school/accounts', label: 'Accounts', icon: Landmark, end: false, permission: ['accounts.view'] },
  { to: '/school/payroll', label: 'Payroll', icon: Banknote, end: false, permission: ['payroll.view'] },
  { to: '/school/library', label: 'Library', icon: BookMarked, end: false, permission: ['library.view'] },
  { to: '/school/transport', label: 'Transport', icon: Bus, end: false, permission: ['transport.view'] },
  { to: '/school/inventory', label: 'Inventory', icon: Package, end: false, permission: ['inventory.view'] },
  { to: '/school/admissions', label: 'Admissions', icon: UserPlus, end: false, permission: ['admissions.view'] },
  { to: '/school/certificates', label: 'Certificates & ID Cards', icon: IdCard, end: false, permission: ['certificates.view'] },
  { to: '/school/messaging', label: 'Announcements & Messages', icon: MessageSquare, end: false, permission: ['announcements.view'] },
  { to: '/school/events', label: 'Events & Calendar', icon: CalendarDays, end: false, permission: ['events.view'] },
  { to: '/school/ptm', label: 'PTM Scheduling', icon: CalendarRange, end: false, permission: ['ptm.view'] },
  { to: '/school/reports', label: 'Reports & Export', icon: FileBarChart, end: false, permission: ['reports.manage'] },
  { to: '/school/audit-log', label: 'Audit Log', icon: ScrollText, end: false, permission: ['audit.view'] },
  { to: '/school/tickets', label: 'Support Tickets', icon: LifeBuoy, end: false, permission: ['tickets.view'] },
  { to: '/school/grievances', label: 'Grievances', icon: HeartHandshake, end: false, permission: ['grievances.view'] },
  { to: '/school/leave', label: 'Leave Management', icon: CalendarOff, end: false, permission: ['leave.view'] },
  { to: '/school/circulars', label: 'Circulars', icon: FileStack, end: false, permission: ['circulars.view'] },
  { to: '/school/surveys', label: 'Parent Surveys', icon: MessageSquareText, end: false, permission: ['surveys.manage'] },
  { to: '/school/settings', label: 'Settings', icon: Settings, end: false, permission: ['staff.edit'] },
  { to: '/school/subscription', label: 'Subscription', icon: CreditCard, end: false },
];

function NavItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof LayoutDashboard; end: boolean }) {
  return (
    <NavLink
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
  );
}

function GatedNavItem({ item }: { item: (typeof navItems)[number] }) {
  const hasAccess = useHasAnyPermission(item.permission ?? []);
  if (item.permission && !hasAccess) return null;
  return <NavItem {...item} />;
}

export function SchoolLayout() {
  const { signOut, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isNativeApp()) {
    return (
      <MobileShell
        homePath="/school/dashboard"
        reportsPath="/school/reports"
        messagesPath="/school/messaging"
        notificationsPath="/school/notifications"
        morePath="/school/more"
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
          <div className="flex min-w-0 items-center gap-2">
            <SchoolLogo className="h-8 w-8 flex-shrink-0 rounded-md object-contain" />
            <div className="min-w-0">
              <p className="truncate font-serif text-base font-semibold tracking-tight text-primary-800 dark:text-gray-50">AURAED SCHOOL</p>
              <p className="truncate text-xs text-gray-500">{profile?.fullName ?? 'School workspace'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NetworkIndicator />
            <NotificationBell align="left" />
            <button onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden" aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" onClick={() => setMobileOpen(false)}>
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
