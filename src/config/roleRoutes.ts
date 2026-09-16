import { ROLES, type RoleName } from '@/types/roles';

// Where a user lands right after login, based on the highest-priority role
// they hold. Order in ROLE_PRIORITY matters for users with multiple roles.
export const ROLE_PRIORITY: RoleName[] = [
  ROLES.SUPER_ADMIN,
  ROLES.SCHOOL_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.ACCOUNTANT,
  ROLES.LIBRARIAN,
  ROLES.RECEPTIONIST,
  ROLES.TRANSPORT_MANAGER,
  ROLES.TEACHER,
  ROLES.PARENT,
  ROLES.STUDENT,
];

export const ROLE_HOME_ROUTE: Record<RoleName, string> = {
  SUPER_ADMIN: '/super-admin',
  SCHOOL_ADMIN: '/school/dashboard',
  TEACHER: '/teacher/dashboard',
  PARENT: '/parent/dashboard',
  STUDENT: '/student/dashboard',
  ACCOUNTANT: '/school/dashboard',
  LIBRARIAN: '/school/dashboard',
  RECEPTIONIST: '/school/dashboard',
  TRANSPORT_MANAGER: '/school/dashboard',
  HR_MANAGER: '/school/dashboard',
};

export function resolveHomeRoute(roles: RoleName[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return ROLE_HOME_ROUTE[role];
  }
  return '/unauthorized';
}
