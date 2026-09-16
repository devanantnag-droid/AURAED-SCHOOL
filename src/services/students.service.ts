import { supabase } from '@/lib/supabase';
import type { PersonStatus, Student, StudentFormValues } from '@/types/people';

function mapRow(row: {
  id: string;
  school_id: string;
  admission_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  blood_group: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  admission_date: string;
  class_id: string | null;
  section_id: string | null;
  class_name: string | null;
  section_name: string | null;
  roll_number: string | null;
  academic_session: string | null;
  house: string | null;
  status: PersonStatus;
}): Student {
  return {
    id: row.id,
    schoolId: row.school_id,
    admissionNumber: row.admission_number,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    bloodGroup: row.blood_group,
    photoUrl: row.photo_url,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    admissionDate: row.admission_date,
    classId: row.class_id,
    sectionId: row.section_id,
    className: row.class_name,
    sectionName: row.section_name,
    rollNumber: row.roll_number,
    academicSession: row.academic_session,
    house: row.house,
    status: row.status,
  };
}

// class_name/section_name are kept as a denormalized display cache on the
// students row (from before classes/sections tables existed — Phase 7
// normalized the structure without dropping these columns). Whenever
// class_id/section_id change, we resolve and write the current names here
// so every other page that still reads class_name/section_name directly
// (lists, reports) keeps working without needing a join.
async function resolveClassSectionNames(
  classId: string | null | undefined,
  sectionId: string | null | undefined
): Promise<{ className: string | null; sectionName: string | null }> {
  let className: string | null = null;
  let sectionName: string | null = null;

  if (classId) {
    const { data } = await supabase.from('classes').select('name').eq('id', classId).maybeSingle();
    className = data?.name ?? null;
  }
  if (sectionId) {
    const { data } = await supabase.from('sections').select('name').eq('id', sectionId).maybeSingle();
    sectionName = data?.name ?? null;
  }

  return { className, sectionName };
}

export async function listStudents(schoolId: string, search?: string): Promise<Student[]> {
  let query = supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (search && search.trim()) {
    const safe = search.trim().replace(/[%,]/g, '');
    query = query.or(
      `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,admission_number.ilike.%${safe}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getStudent(id: string): Promise<Student | null> {
  const { data, error } = await supabase.from('students').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function createStudent(schoolId: string, values: StudentFormValues): Promise<Student> {
  const { className, sectionName } = await resolveClassSectionNames(values.classId, values.sectionId);

  const { data, error } = await supabase
    .from('students')
    .insert({
      school_id: schoolId,
      admission_number: values.admissionNumber,
      first_name: values.firstName,
      middle_name: values.middleName || null,
      last_name: values.lastName,
      date_of_birth: values.dateOfBirth || null,
      gender: values.gender || null,
      blood_group: values.bloodGroup || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      postal_code: values.postalCode || null,
      admission_date: values.admissionDate || new Date().toISOString().slice(0, 10),
      class_id: values.classId || null,
      section_id: values.sectionId || null,
      class_name: className,
      section_name: sectionName,
      roll_number: values.rollNumber || null,
      academic_session: values.academicSession || null,
      house: values.house || null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateStudent(id: string, values: Partial<StudentFormValues>): Promise<Student> {
  const patch: Record<string, unknown> = {};
  if (values.admissionNumber !== undefined) patch.admission_number = values.admissionNumber;
  if (values.firstName !== undefined) patch.first_name = values.firstName;
  if (values.middleName !== undefined) patch.middle_name = values.middleName || null;
  if (values.lastName !== undefined) patch.last_name = values.lastName;
  if (values.dateOfBirth !== undefined) patch.date_of_birth = values.dateOfBirth || null;
  if (values.gender !== undefined) patch.gender = values.gender || null;
  if (values.bloodGroup !== undefined) patch.blood_group = values.bloodGroup || null;
  if (values.email !== undefined) patch.email = values.email || null;
  if (values.phone !== undefined) patch.phone = values.phone || null;
  if (values.address !== undefined) patch.address = values.address || null;
  if (values.city !== undefined) patch.city = values.city || null;
  if (values.state !== undefined) patch.state = values.state || null;
  if (values.postalCode !== undefined) patch.postal_code = values.postalCode || null;
  if (values.admissionDate !== undefined) patch.admission_date = values.admissionDate;
  if (values.rollNumber !== undefined) patch.roll_number = values.rollNumber || null;
  if (values.academicSession !== undefined) patch.academic_session = values.academicSession || null;
  if (values.house !== undefined) patch.house = values.house || null;

  if (values.classId !== undefined || values.sectionId !== undefined) {
    const { className, sectionName } = await resolveClassSectionNames(values.classId, values.sectionId);
    patch.class_id = values.classId || null;
    patch.section_id = values.sectionId || null;
    patch.class_name = className;
    patch.section_name = sectionName;
  }

  const { data, error } = await supabase.from('students').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return mapRow(data);
}

export async function setStudentStatus(id: string, status: PersonStatus): Promise<void> {
  const { error } = await supabase.from('students').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function countStudents(schoolId: string): Promise<number> {
  const { count, error } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}
