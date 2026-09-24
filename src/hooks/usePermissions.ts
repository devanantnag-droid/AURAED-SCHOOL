import { useAuth } from '@/contexts/AuthContext';
import type { RoleName } from '@/types/roles';

// The single call site every component should use to gate UI.
// Never hard-code `if (role === 'TEACHER')` in a component — check the
// permission the action requires instead, so changing what a role can do
// is a data change (role_permissions table), not a code change.
export function usePermission(code: string): boolean {
  const { permissions } = useAuth();
  return permissions.has(code);
}

export function useHasAnyPermission(codes: string[]): boolean {
  const { permissions } = useAuth();
  return codes.some((c) => permissions.has(c));
}

export function useHasRole(roleName: RoleName): boolean {
  const { roles } = useAuth();
  return roles.some((r) => r.roleName === roleName);
}

export function useRoles(): RoleName[] {
  const { roles } = useAuth();
  return roles.map((r) => r.roleName);
}
