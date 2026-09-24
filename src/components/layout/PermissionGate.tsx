import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermissions';

// Use this to hide/show a button, section, or field — not for guarding an
// entire route (use RoleGuard for that). Example:
//   <PermissionGate code="students.delete"><DeleteButton /></PermissionGate>
export function PermissionGate({
  code,
  fallback = null,
  children,
}: {
  code: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = usePermission(code);
  return <>{allowed ? children : fallback}</>;
}
