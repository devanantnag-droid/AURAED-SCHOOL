import { supabase } from '@/lib/supabase';
import type { School, SchoolFormValues } from '@/types/school';

function mapRow(row: {
  id: string;
  name: string;
  code: string;
  registration_number: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  logo_url: string | null;
  principal_name: string | null;
  website: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}): School {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    registrationNumber: row.registration_number,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postal_code,
    logoUrl: row.logo_url,
    principalName: row.principal_name,
    website: row.website,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSchools(search?: string): Promise<School[]> {
  let query = supabase.from('schools').select('*').order('created_at', { ascending: false });

  if (search && search.trim().length > 0) {
    // Search by name OR code. Escape % and , which have meaning in PostgREST's or() syntax.
    const safe = search.trim().replace(/[%,]/g, '');
    query = query.or(`name.ilike.%${safe}%,code.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getSchool(id: string): Promise<School | null> {
  const { data, error } = await supabase.from('schools').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function createSchool(values: SchoolFormValues): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .insert({
      name: values.name,
      code: values.code,
      email: values.email,
      phone: values.phone || null,
      registration_number: values.registrationNumber || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      country: values.country || null,
      postal_code: values.postalCode || null,
      principal_name: values.principalName || null,
      website: values.website || null,
      description: values.description || null,
    })
    .select('*')
    .single();

  if (error) throw error;

  // Every school gets a settings row created alongside it.
  const { error: settingsError } = await supabase
    .from('school_settings')
    .insert({ school_id: data.id })
    .select('school_id')
    .maybeSingle();
  if (settingsError && settingsError.code !== '23505') {
    // 23505 = already exists, harmless if this races with a trigger later.
    throw settingsError;
  }

  return mapRow(data);
}

export async function updateSchool(id: string, values: Partial<SchoolFormValues>): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .update({
      ...(values.name !== undefined && { name: values.name }),
      ...(values.code !== undefined && { code: values.code }),
      ...(values.email !== undefined && { email: values.email }),
      ...(values.phone !== undefined && { phone: values.phone || null }),
      ...(values.registrationNumber !== undefined && {
        registration_number: values.registrationNumber || null,
      }),
      ...(values.address !== undefined && { address: values.address || null }),
      ...(values.city !== undefined && { city: values.city || null }),
      ...(values.state !== undefined && { state: values.state || null }),
      ...(values.country !== undefined && { country: values.country || null }),
      ...(values.postalCode !== undefined && { postal_code: values.postalCode || null }),
      ...(values.principalName !== undefined && { principal_name: values.principalName || null }),
      ...(values.website !== undefined && { website: values.website || null }),
      ...(values.description !== undefined && { description: values.description || null }),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function setSchoolActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('schools').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}
