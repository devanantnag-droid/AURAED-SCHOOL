import type { RoleName } from './roles';

export interface Profile {
  id: string;
  schoolId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: 'pending' | 'active' | 'inactive';
}

export interface UserRoleAssignment {
  roleId: string;
  roleName: RoleName;
  schoolId: string | null;
}

export interface AuthState {
  loading: boolean;
  userId: string | null;
  profile: Profile | null;
  roles: UserRoleAssignment[];
  permissions: Set<string>;
}
