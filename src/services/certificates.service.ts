import { supabase } from '@/lib/supabase';
import type { CertificateTemplate, CertificateType, IssuedCertificate } from '@/types/certificates';

export async function listTemplates(schoolId: string): Promise<CertificateTemplate[]> {
  const { data, error } = await supabase.from('certificate_templates').select('*').eq('school_id', schoolId).order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    certificateType: r.certificate_type as CertificateType,
    bodyTemplate: r.body_template,
  }));
}

export async function createTemplate(input: {
  schoolId: string;
  name: string;
  certificateType: CertificateType;
  bodyTemplate: string;
}): Promise<void> {
  const { error } = await supabase.from('certificate_templates').insert({
    school_id: input.schoolId,
    name: input.name,
    certificate_type: input.certificateType,
    body_template: input.bodyTemplate,
  });
  if (error) throw error;
}

// Simple {{placeholder}} substitution — no templating engine needed for
// this small, fixed set of fields.
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`);
}

export async function issueCertificate(input: {
  schoolId: string;
  studentId: string;
  templateId?: string | null;
  certificateType: string;
  bodyText: string;
}): Promise<IssuedCertificate> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('issued_certificates')
    .insert({
      school_id: input.schoolId,
      student_id: input.studentId,
      template_id: input.templateId || null,
      certificate_type: input.certificateType,
      certificate_number: '',
      body_text: input.bodyText,
      issued_by: user?.id ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  return {
    id: data.id,
    studentId: data.student_id,
    certificateType: data.certificate_type as CertificateType,
    certificateNumber: data.certificate_number,
    bodyText: data.body_text,
    issuedDate: data.issued_date,
  };
}

export async function listIssuedCertificates(schoolId: string): Promise<IssuedCertificate[]> {
  const { data, error } = await supabase
    .from('issued_certificates')
    .select('*, students(first_name, last_name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    studentId: r.student_id,
    studentName: r.students ? `${r.students.first_name} ${r.students.last_name}` : undefined,
    certificateType: r.certificate_type,
    certificateNumber: r.certificate_number,
    bodyText: r.body_text,
    issuedDate: r.issued_date,
  }));
}
