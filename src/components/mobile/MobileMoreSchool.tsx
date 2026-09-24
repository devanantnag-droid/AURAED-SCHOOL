import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Contact,
  Briefcase,
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  Award,
  ListChecks,
  Wallet,
  Landmark,
  Banknote,
  BookMarked,
  Bus,
  Package,
  UserPlus,
  IdCard,
  MessageSquare,
  CalendarCheck,
  Fingerprint,
  Users2,
  FileText,
  ScrollText,
  LifeBuoy,
  HeartHandshake,
  CalendarOff,
  FileStack,
  Settings,
  CreditCard,
  Armchair,
  MessageSquareText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useHasAnyPermission } from '@/hooks/usePermissions';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';

interface Tile {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: string[];
}

interface Category {
  title: string;
  tiles: Tile[];
}

const categories: Category[] = [
  {
    title: 'Academics',
    tiles: [
      { to: '/school/academics', label: 'Classes & Subjects', icon: BookOpen, permission: ['academics.view'] },
      { to: '/school/timetable', label: 'Timetable', icon: CalendarClock, permission: ['academics.view'] },
      { to: '/school/homework', label: 'Homework', icon: ClipboardList, permission: ['homework.view'] },
      { to: '/school/assignments-work', label: 'Assignments', icon: FileCheck2, permission: ['assignments.view'] },
      { to: '/school/materials', label: 'Study Materials', icon: BookMarked, permission: ['study_materials.view'] },
      { to: '/school/exams', label: 'Exams', icon: FileText, permission: ['exams.view'] },
      { to: '/school/marks', label: 'Marks', icon: ListChecks, permission: ['marks.view'] },
      { to: '/school/report-cards', label: 'Report Cards', icon: Award, permission: ['marks.view'] },
      { to: '/school/exam-seating', label: 'Exam Seating', icon: Armchair, permission: ['exam_seating.manage'] },
    ],
  },
  {
    title: 'People',
    tiles: [
      { to: '/school/students', label: 'Students', icon: Users, permission: ['students.view'] },
      { to: '/school/teachers', label: 'Teachers', icon: GraduationCap, permission: ['teachers.view'] },
      { to: '/school/parents', label: 'Parents', icon: Contact, permission: ['parents.view'] },
      { to: '/school/staff', label: 'Staff', icon: Briefcase, permission: ['staff.view'] },
      { to: '/school/attendance', label: 'Attendance', icon: CalendarCheck, permission: ['attendance.view'] },
      { to: '/school/punch', label: 'Punch In/Out', icon: Fingerprint },
      { to: '/school/teacher-attendance', label: 'Teacher Attendance', icon: Fingerprint, permission: ['attendance.view'] },
      { to: '/school/assignments', label: 'Teacher Assignments', icon: Users2, permission: ['academics.view'] },
      { to: '/school/leave', label: 'Leave Management', icon: CalendarOff, permission: ['leave.view'] },
    ],
  },
  {
    title: 'Communication',
    tiles: [
      { to: '/school/messaging', label: 'Announcements & Messages', icon: MessageSquare, permission: ['announcements.view'] },
      { to: '/school/events', label: 'Events & Calendar', icon: CalendarClock, permission: ['events.view'] },
      { to: '/school/ptm', label: 'PTM Scheduling', icon: CalendarClock, permission: ['ptm.view'] },
      { to: '/school/circulars', label: 'Circulars', icon: FileStack, permission: ['circulars.view'] },
      { to: '/school/surveys', label: 'Parent Surveys', icon: MessageSquareText, permission: ['surveys.manage'] },
      { to: '/school/grievances', label: 'Grievances', icon: HeartHandshake, permission: ['grievances.view'] },
      { to: '/school/tickets', label: 'Support Tickets', icon: LifeBuoy, permission: ['tickets.view'] },
    ],
  },
  {
    title: 'Finance',
    tiles: [
      { to: '/school/fees', label: 'Fees', icon: Wallet, permission: ['fees.view'] },
      { to: '/school/accounts', label: 'Accounts', icon: Landmark, permission: ['accounts.view'] },
      { to: '/school/payroll', label: 'Payroll', icon: Banknote, permission: ['payroll.view'] },
      { to: '/school/subscription', label: 'Subscription', icon: CreditCard },
    ],
  },
  {
    title: 'Services',
    tiles: [
      { to: '/school/library', label: 'Library', icon: BookMarked, permission: ['library.view'] },
      { to: '/school/transport', label: 'Transport', icon: Bus, permission: ['transport.view'] },
      { to: '/school/inventory', label: 'Inventory', icon: Package, permission: ['inventory.view'] },
      { to: '/school/admissions', label: 'Admissions', icon: UserPlus, permission: ['admissions.view'] },
      { to: '/school/certificates', label: 'Certificates & ID Cards', icon: IdCard, permission: ['certificates.view'] },
    ],
  },
  {
    title: 'Reports & Settings',
    tiles: [
      { to: '/school/reports', label: 'Reports & Export', icon: FileText, permission: ['reports.manage'] },
      { to: '/school/audit-log', label: 'Audit Log', icon: ScrollText, permission: ['audit.view'] },
      { to: '/school/settings', label: 'Settings', icon: Settings, permission: ['staff.edit'] },
    ],
  },
];

function GatedTile({ tile }: { tile: Tile }) {
  const hasAccess = useHasAnyPermission(tile.permission ?? []);
  if (tile.permission && !hasAccess) return null;
  return (
    <Link
      to={tile.to}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
        <tile.icon size={20} />
      </span>
      <span className="text-xs font-medium leading-tight text-gray-700 dark:text-gray-300">{tile.label}</span>
    </Link>
  );
}

export function MobileMoreSchool() {
  return (
    <div>
      <MobileDetailHeader title="More" />
      <div className="space-y-6 p-4">
        {categories.map((cat) => (
          <section key={cat.title}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{cat.title}</p>
            <div className="grid grid-cols-3 gap-3">
              {cat.tiles.map((tile) => (
                <GatedTile key={tile.to} tile={tile} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
