import { useEffect, useState } from 'react';
import { Users, GraduationCap, CalendarCheck, Wallet, BookOpen, MessageSquareText, ClipboardList, CalendarOff, Fingerprint } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileHomeHeader } from '@/components/mobile/MobileHeader';
import { SummaryCard, IconGridTile } from '@/components/mobile/MobileTiles';
import { getDashboardSummary } from '@/services/reports.service';
import type { DashboardSummary } from '@/services/reports.service';
import { getSchool } from '@/services/schools.service';

export function MobileHomeSchool() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [schoolName, setSchoolName] = useState<string | undefined>();

  useEffect(() => {
    if (!profile?.schoolId) return;
    getDashboardSummary(profile.schoolId).then(setSummary).catch(() => {});
    getSchool(profile.schoolId).then((s) => setSchoolName(s?.name)).catch(() => {});
  }, [profile?.schoolId]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <MobileHomeHeader subtitle={schoolName} />

      <div className="p-4">
        <p className="mb-4 text-lg font-semibold text-primary-900 dark:text-gray-50">
          {greeting}, {profile?.fullName?.split(' ')[0] ?? 'there'}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <SummaryCard label="Students" value={summary?.totalStudents} />
          <SummaryCard label="Teachers" value={summary?.totalTeachers} />
          <SummaryCard label="Present today" value={summary ? `${summary.presentToday}/${summary.totalMarkedToday}` : undefined} />
          <SummaryCard label="Fees pending" value={summary ? `₹${summary.feesPendingTotal}` : undefined} />
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Quick actions</p>
        <div className="grid grid-cols-3 gap-3">
          <IconGridTile to="/school/punch" icon={Fingerprint} label="Punch In/Out" />
          <IconGridTile to="/school/students" icon={Users} label="Students" />
          <IconGridTile to="/school/teachers" icon={GraduationCap} label="Teachers" />
          <IconGridTile to="/school/attendance" icon={CalendarCheck} label="Attendance" />
          <IconGridTile to="/school/fees" icon={Wallet} label="Fees" />
          <IconGridTile to="/school/homework" icon={BookOpen} label="Homework" />
          <IconGridTile to="/school/leave" icon={CalendarOff} label="Leave" />
          <IconGridTile to="/school/circulars" icon={ClipboardList} label="Circulars" />
          <IconGridTile to="/school/messaging" icon={MessageSquareText} label="Messages" />
        </div>
      </div>
    </div>
  );
}
