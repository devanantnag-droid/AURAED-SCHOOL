import { useAuth } from '@/contexts/AuthContext';

export function StudentDashboard() {
  const { profile } = useAuth();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Student Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Welcome {profile?.fullName}.</p>
    </div>
  );
}
