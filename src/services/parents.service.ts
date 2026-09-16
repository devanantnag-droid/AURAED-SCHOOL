import { supabase } from '@/lib/supabase';
import type { Parent, ParentFormValues } from '@/types/people';

async function mapRow(row: {
  id: string;
  school_id: string;
  full_name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  occupation: string | null;
  photo_url: string | null;
}): Promise<Parent> {
  const { data: links } = await supabase.from('parent_students').select('student_id').eq('parent_id', row.id);

  return {
    id: row.id,
    schoolId: row.school_id,
    fullName: row.full_name,
    relationship: row.relationship,
    phone: row.phone,
    email: row.email,
    address: row.address,
    occupation: row.occupation,
    photoUrl: row.photo_url,
    childIds: (links ?? []).map((l) => l.student_id),
  };
}

export async function listParents(schoolId: string, search?: string): Promise<Parent[]> {
  let query = supabase
    .from('parents')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (search && search.trim()) {
    const safe = search.trim().replace(/[%,]/g, '');
    query = query.or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Promise.all((data ?? []).map(mapRow));
}

export async function getParent(id: string): Promise<Parent | null> {
  const { data, error } = await supabase.from('parents').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function createParent(
  schoolId: string,
  values: ParentFormValues,
  childIds: string[] = []
): Promise<Parent> {
  const { data, error } = await supabase
    .from('parents')
    .insert({
      school_id: schoolId,
      full_name: values.fullName,
      relationship: values.relationship || null,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      occupation: values.occupation || null,
    })
    .select('*')
    .single();

  if (error) throw error;

  if (childIds.length > 0) {
    const { error: linkError } = await supabase
      .from('parent_students')
      .insert(childIds.map((student_id) => ({ parent_id: data.id, student_id })));
    if (linkError) throw linkError;
  }

  return mapRow(data);
}

export async function updateParent(
  id: string,
  values: Partial<ParentFormValues>,
  childIds?: string[]
): Promise<Parent> {
  const patch: Record<string, unknown> = {};
  if (values.fullName !== undefined) patch.full_name = values.fullName;
  if (values.relationship !== undefined) patch.relationship = values.relationship || null;
  if (values.phone !== undefined) patch.phone = values.phone || null;
  if (values.email !== undefined) patch.email = values.email || null;
  if (values.address !== undefined) patch.address = values.address || null;
  if (values.occupation !== undefined) patch.occupation = values.occupation || null;

  const { data, error } = await supabase.from('parents').update(patch).eq('id', id).select('*').single();
  if (error) throw error;

  if (childIds !== undefined) {
    const { error: deleteError } = await supabase.from('parent_students').delete().eq('parent_id', id);
    if (deleteError) throw deleteError;
    if (childIds.length > 0) {
      const { error: insertError } = await supabase
        .from('parent_students')
        .insert(childIds.map((student_id) => ({ parent_id: id, student_id })));
      if (insertError) throw insertError;
    }
  }

  return mapRow(data);
}

export async function countParents(schoolId: string): Promise<number> {
  const { count, error } = await supabase
    .from('parents')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId);
  if (error) throw error;
  return count ?? 0;
}
