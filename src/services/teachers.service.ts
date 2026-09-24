import { supabase } from '@/lib/supabase';
import type { PersonStatus, Teacher, TeacherFormValues } from '@/types/people';

function mapRow(row: {
  id: string;
  school_id: string;
  user_id: string | null;
  employee_id: string;
  full_name: string;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  qualification: string | null;
  joining_date: string;
  department: string | null;
  designation: string | null;
  photo_url: string | null;
  status: string;
}): Teacher {
  return {
    id: row.id,
    schoolId: row.school_id,
    userId: row.user_id,
    employeeId: row.employee_id,
    fullName: row.full_name,
    gender: row.gender as Teacher['gender'],
    dateOfBirth: row.date_of_birth,
    phone: row.phone,
    email: row.email,
    address: row.address,
    qualification: row.qualification,
    joiningDate: row.joining_date,
    department: row.department,
    designation: row.designation,
    photoUrl: row.photo_url,
    status: row.status as PersonStatus,
  };
}

export async function listTeachers(schoolId: string, search?: string): Promise<Teacher[]> {
  let query = supabase
    .from('teachers')
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

export async function getTeacher(id: string): Promise<Teacher | null> {
  const { data, error } = await supabase.from('teachers').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function createTeacher(schoolId: string, values: TeacherFormValues): Promise<Teacher> {
  const { data, error } = await supabase
    .from('teachers')
    .insert({
      school_id: schoolId,
      employee_id: values.employeeId,
      full_name: values.fullName,
      gender: values.gender || null,
      date_of_birth: values.dateOfBirth || null,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      qualification: values.qualification || null,
      joining_date: values.joiningDate || new Date().toISOString().slice(0, 10),
      department: values.department || null,
      designation: values.designation || null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateTeacher(id: string, values: Partial<TeacherFormValues>): Promise<Teacher> {
  const patch: Record<string, unknown> = {};
  if (values.employeeId !== undefined) patch.employee_id = values.employeeId;
  if (values.fullName !== undefined) patch.full_name = values.fullName;
  if (values.gender !== undefined) patch.gender = values.gender || null;
  if (values.dateOfBirth !== undefined) patch.date_of_birth = values.dateOfBirth || null;
  if (values.phone !== undefined) patch.phone = values.phone || null;
  if (values.email !== undefined) patch.email = values.email || null;
  if (values.address !== undefined) patch.address = values.address || null;
  if (values.qualification !== undefined) patch.qualification = values.qualification || null;
  if (values.joiningDate !== undefined) patch.joining_date = values.joiningDate;
  if (values.department !== undefined) patch.department = values.department || null;
  if (values.designation !== undefined) patch.designation = values.designation || null;

  const { data, error } = await supabase.from('teachers').update(patch as never).eq('id', id).select('*').single();
  if (error) throw error;
  return mapRow(data);
}

export async function setTeacherStatus(id: string, status: PersonStatus): Promise<void> {
  const { error } = await supabase.from('teachers').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function countTeachers(schoolId: string): Promise<number> {
  const { count, error } = await supabase
    .from('teachers')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}
