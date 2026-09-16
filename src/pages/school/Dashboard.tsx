import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolSubscription } from '@/services/subscriptions.service';
import { countStudents } from '@/services/students.service';
import { countTeachers } from '@/services/teachers.service';
import { countParents } from '@/services/parents.service';
import { countStaff } from '@/services/staff.service';
import type { Subscription } from '@/types/plan';

const statusStyles: Record<string, string> = {
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  expiring: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  expired: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  suspended: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

export function SchoolAdminDashboard() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [counts, setCounts] = useState<{ students: number; teachers: number; parents: number; staff: number } | null>(null);

  useEffect(() => {
    if (!profile?.schoolId) return;
    const schoolId = profile.schoolId;

    getSchoolSubscription(schoolId).then(setSubscription);

    Promise.all([
      countStudents(schoolId).catch(() => 0),
      countTeachers(schoolId).catch(() => 0),
      countParents(schoolId).catch(() => 0),
      countStaff(schoolId).catch(() => 0),
    ]).then(([students, teachers, parents, staff]) => {
      setCounts({ students, teachers, parents, staff });
    });
  }, [profile?.schoolId]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">School Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">School ID: {profile?.schoolId ?? 'unassigned'}</p>

      {subscription && (
        <Link
          to="/school/subscription"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
        >
          Plan: <strong>{subscription.plan?.name}</strong>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[subscription.effectiveStatus] ?? ''}`}>
            {subscription.effectiveStatus}
          </span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Students" value={counts?.students} to="/school/students" />
        <StatCard label="Teachers" value={counts?.teachers} to="/school/teachers" />
        <StatCard label="Parents" value={counts?.parents} to="/school/parents" />
        <StatCard label="Staff" value={counts?.staff} to="/school/staff" />
      </div>
    </div>
  );
}

function StatCard({ label, value, to }: { label: string; value: number | undefined; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-md border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50">{value ?? '—'}</p>
    </Link>
  );
}
