export type CertificateType = 'bonafide' | 'transfer' | 'character' | 'custom';

export interface CertificateTemplate {
  id: string;
  name: string;
  certificateType: CertificateType;
  bodyTemplate: string;
}

export interface IssuedCertificate {
  id: string;
  studentId: string;
  studentName?: string;
  certificateType: string;
  certificateNumber: string;
  bodyText: string;
  issuedDate: string;
}

export const CERTIFICATE_TYPES: { value: CertificateType; label: string; defaultBody: string }[] = [
  {
    value: 'bonafide',
    label: 'Bonafide Certificate',
    defaultBody:
      'This is to certify that {{student_name}}, admission number {{admission_number}}, is a bonafide student of {{school_name}}, currently studying in class {{class}} during the academic session {{session}}.',
  },
  {
    value: 'transfer',
    label: 'Transfer Certificate',
    defaultBody:
      'This is to certify that {{student_name}}, admission number {{admission_number}}, was a student of {{school_name}} in class {{class}} and is being relieved as of {{date}}.',
  },
  {
    value: 'character',
    label: 'Character Certificate',
    defaultBody:
      'This is to certify that {{student_name}}, admission number {{admission_number}}, a student of {{school_name}} in class {{class}}, bears a good moral character to the best of our knowledge.',
  },
  { value: 'custom', label: 'Custom', defaultBody: '' },
];
