import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoles } from '@/hooks/usePermissions';
import type { RoleName } from '@/types/roles';

export function RoleGuard({ allow, children }: { allow: RoleName[]; children: ReactNode }) {
  const roles = useRoles();
  const authorized = roles.some((r) => allow.includes(r));

  if (!authorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
