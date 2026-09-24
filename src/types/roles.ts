// Keep this list in sync with supabase/migrations/0001_initial_schema.sql
// (the `roles` seed rows). Adding a role here does NOT grant it any
// permissions by itself — that's controlled by role_permissions in the DB,
// editable by Super Admin without a redeploy.
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
  ACCOUNTANT: 'ACCOUNTANT',
  LIBRARIAN: 'LIBRARIAN',
  RECEPTIONIST: 'RECEPTIONIST',
  TRANSPORT_MANAGER: 'TRANSPORT_MANAGER',
  HR_MANAGER: 'HR_MANAGER',
  DRIVER: 'DRIVER',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// A small, growing catalog. Permissions are still driven by the DB
// (`permissions` table) — this const object exists only so TypeScript can
// autocomplete/catch typos at call sites like usePermission('students.view').
// It is NOT the source of truth for what a role can do.
export const PERMISSIONS = {
  STUDENTS_VIEW: 'students.view',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_EDIT: 'students.edit',
  STUDENTS_DELETE: 'students.delete',
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_EDIT: 'attendance.edit',
  FEES_VIEW: 'fees.view',
  FEES_CREATE: 'fees.create',
  FEES_EDIT: 'fees.edit',
  FEES_DELETE: 'fees.delete',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  ANNOUNCEMENTS_CREATE: 'announcements.create',
  ANNOUNCEMENTS_PUBLISH: 'announcements.publish',
  PLATFORM_MANAGE: 'platform.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
