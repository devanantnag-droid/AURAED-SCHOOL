import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/usePermissions';
import { resolveHomeRoute } from '@/config/roleRoutes';
import { SetPasswordPage } from '@/pages/auth/SetPassword';

export function AuthLanding() {
  const { loading, userId } = useAuth();
  const roles = useRoles();

  // An invite/recovery link redirected here with a token that Supabase's
  // client already exchanged for a session — main.tsx captured which flow
  // it was before the URL hash got stripped. Show the set-password form
  // regardless of auth-loading state, since a fresh invite session is what
  // we're reacting to.
  const flow = sessionStorage.getItem('auraed_auth_flow');
  if (flow === 'invite' || flow === 'recovery') {
    return <SetPasswordPage />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">Loading…</div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={resolveHomeRoute(roles)} replace />;
}
