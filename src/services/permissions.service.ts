import { supabase } from '@/lib/supabase';
import type { Profile, UserRoleAssignment } from '@/types/auth';
import type { RoleName } from '@/types/roles';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, school_id, full_name, email, phone, avatar_url, status')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    schoolId: data.school_id,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    avatarUrl: data.avatar_url,
    status: data.status as Profile['status'],
  };
}

export async function fetchUserRoles(userId: string): Promise<UserRoleAssignment[]> {
  // RLS on user_roles restricts this to the caller's own rows (see 0002 migration),
  // so there's no need to double-filter by user_id here — but we do it anyway
  // for query correctness/readability, not as the security boundary.
  const { data, error } = await supabase
    .from('user_roles')
    .select('role_id, school_id, roles(name)')
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    roleId: row.role_id,
    roleName: (row as unknown as { roles: { name: RoleName } }).roles.name,
    schoolId: row.school_id,
  }));
}

export async function fetchResolvedPermissions(roleIds: string[]): Promise<Set<string>> {
  if (roleIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from('role_permissions')
    .select('permissions(code)')
    .in('role_id', roleIds);

  if (error) throw error;

  const codes = (data ?? []).map(
    (row) => (row as unknown as { permissions: { code: string } }).permissions.code
  );
  return new Set(codes);
}
