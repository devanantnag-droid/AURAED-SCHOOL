import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, userId, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.status === 'inactive') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
