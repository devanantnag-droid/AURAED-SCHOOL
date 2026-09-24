import { supabase } from '@/lib/supabase';
import type { PersonStatus, StaffFormValues, StaffMember } from '@/types/people';

function mapRow(row: {
  id: string;
  school_id: string;
  employee_id: string;
  full_name: string;
  role_title: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  joining_date: string;
  status: string;
}): StaffMember {
  return {
    id: row.id,
    schoolId: row.school_id,
    employeeId: row.employee_id,
    fullName: row.full_name,
    roleTitle: row.role_title,
    department: row.department,
    phone: row.phone,
    email: row.email,
    joiningDate: row.joining_date,
    status: row.status as PersonStatus,
  };
}

export async function listStaff(schoolId: string, search?: string): Promise<StaffMember[]> {
  let query = supabase
    .from('staff')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (search && search.trim()) {
    const safe = search.trim().replace(/[%,]/g, '');
    query = query.or(`full_name.ilike.%${safe}%,employee_id.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createStaff(schoolId: string, values: StaffFormValues): Promise<StaffMember> {
  const { data, error } = await supabase
    .from('staff')
    .insert({
      school_id: schoolId,
      employee_id: values.employeeId,
      full_name: values.fullName,
      role_title: values.roleTitle || null,
      department: values.department || null,
      phone: values.phone || null,
      email: values.email || null,
      joining_date: values.joiningDate || new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateStaff(id: string, values: Partial<StaffFormValues>): Promise<StaffMember> {
  const patch: Record<string, unknown> = {};
  if (values.employeeId !== undefined) patch.employee_id = values.employeeId;
  if (values.fullName !== undefined) patch.full_name = values.fullName;
  if (values.roleTitle !== undefined) patch.role_title = values.roleTitle || null;
  if (values.department !== undefined) patch.department = values.department || null;
  if (values.phone !== undefined) patch.phone = values.phone || null;
  if (values.email !== undefined) patch.email = values.email || null;
  if (values.joiningDate !== undefined) patch.joining_date = values.joiningDate;

  const { data, error } = await supabase.from('staff').update(patch as never).eq('id', id).select('*').single();
  if (error) throw error;
  return mapRow(data);
}

export async function setStaffStatus(id: string, status: PersonStatus): Promise<void> {
  const { error } = await supabase.from('staff').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function countStaff(schoolId: string): Promise<number> {
  const { count, error } = await supabase
    .from('staff')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}
