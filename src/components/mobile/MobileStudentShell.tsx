import { useEffect, useState } from 'react';
import { Home, BookOpen, Wallet, Award, Megaphone, Grid3x3, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';
import { getPortalSummary } from '@/services/portal.service';
import type { PortalSummary } from '@/services/portal.service';
import { MobileHomeHeader, MobileDetailHeader } from '@/components/mobile/MobileHeader';
import { SummaryCard } from '@/components/mobile/MobileTiles';
import { MobileHomework } from '@/components/mobile/MobileHomework';
import { MobileFees } from '@/components/mobile/MobileFees';
import { MobileResults } from '@/components/mobile/MobileResults';
import { MobileAnnouncements } from '@/components/mobile/MobileAnnouncements';
import { MySeatAssignments } from '@/components/shared/MySeatAssignments';
import { MyLeaveRequests } from '@/components/shared/MyLeaveRequests';

type Tab = 'home' | 'homework' | 'fees' | 'results' | 'announcements' | 'more';

interface OwnStudent {
  id: string;
  firstName: string;
  lastName: string;
  className: string | null;
  sectionName: string | null;
}

function QuickTile({ icon: Icon, label, onClick }: { icon: typeof Home; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
        <Icon size={20} />
      </span>
      <span className="text-xs font-medium leading-tight text-gray-700 dark:text-gray-300">{label}</span>
    </button>
  );
}

export function MobileStudentShell() {
  const { profile, signOut } = useAuth();
  const [student, setStudent] = useState<OwnStudent | null>(null);
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('home');

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, classes(name), sections(name)')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setErrorMsg('Your login isn\u2019t linked to a student record yet — ask your School Admin to check your portal invite.');
          return;
        }
        setStudent({
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          className: (data as unknown as { classes: { name: string } | null }).classes?.name ?? null,
          sectionName: (data as unknown as { sections: { name: string } | null }).sections?.name ?? null,
        });
        if (profile?.schoolId) {
          setSummary(await getPortalSummary(profile.schoolId, data.id));
        }
      } catch (err) {
        setErrorMsg(getErrorMessage(err, 'Failed to load your details.'));
      }
    })();
  }, [profile?.schoolId]);

  const tabs: { key: Tab; label: string; icon: typeof Home }[] = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'homework', label: 'Homework', icon: BookOpen },
    { key: 'fees', label: 'Fees', icon: Wallet },
    { key: 'results', label: 'Results', icon: Award },
    { key: 'more', label: 'More', icon: Grid3x3 },
  ];

  function renderContent() {
    if (errorMsg && !student) {
      return <p className="m-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>;
    }
    if (!student) {
      return <p className="py-16 text-center text-sm text-gray-500">Loading…</p>;
    }

    if (tab === 'home') {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      return (
        <div>
          <MobileHomeHeader subtitle={`${student.className ?? ''} - ${student.sectionName ?? ''}`} />
          <div className="p-4">
            <p className="mb-4 text-lg font-semibold text-primary-900 dark:text-gray-50">
              {greeting}, {student.firstName}
            </p>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <SummaryCard label="Attendance" value={summary?.attendancePercentage != null ? `${summary.attendancePercentage}%` : undefined} />
              <SummaryCard label="Homework" value={summary?.homework.length} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Quick actions</p>
            <div className="grid grid-cols-3 gap-3">
              <QuickTile icon={BookOpen} label="Homework" onClick={() => setTab('homework')} />
              <QuickTile icon={Wallet} label="Fees" onClick={() => setTab('fees')} />
              <QuickTile icon={Award} label="Results" onClick={() => setTab('results')} />
              <QuickTile icon={Megaphone} label="Announce" onClick={() => setTab('announcements')} />
            </div>
          </div>
        </div>
      );
    }
    if (tab === 'homework') return <MobileHomework onBack={() => setTab('home')} />;
    if (tab === 'fees')
      return (
        <>
          <MobileDetailHeader title="Fees" onBack={() => setTab('home')} />
          <MobileFees fees={summary?.fees ?? []} />
        </>
      );
    if (tab === 'results')
      return (
        <>
          <MobileDetailHeader title="Results" onBack={() => setTab('home')} />
          <MobileResults marks={summary?.recentMarks ?? []} />
          <div className="px-4 pb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Exam Seating</p>
            <MySeatAssignments studentId={student.id} />
          </div>
        </>
      );
    if (tab === 'announcements')
      return profile?.schoolId ? (
        <>
          <MobileDetailHeader title="Announcements" onBack={() => setTab('home')} />
          <MobileAnnouncements schoolId={profile.schoolId} />
        </>
      ) : null;
    if (tab === 'more') {
      return (
        <div>
          <MobileDetailHeader title="More" />
          <div className="grid grid-cols-3 gap-3 p-4">
            <QuickTile icon={Megaphone} label="Announcements" onClick={() => setTab('announcements')} />
          </div>
          <div className="px-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Leave</p>
            {profile?.schoolId && <MyLeaveRequests schoolId={profile.schoolId} requesterType="student" studentId={student.id} />}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper dark:bg-paper-dark">
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2">{renderContent()}</main>

      <nav className="flex items-stretch justify-around border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-900">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              tab === t.key ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <t.icon size={20} />
            {t.label}
          </button>
        ))}
        <button onClick={() => signOut()} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">
          <LogOut size={20} />
          Sign out
        </button>
      </nav>
    </div>
  );
}
