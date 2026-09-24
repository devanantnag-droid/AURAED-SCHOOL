import { useEffect, useState } from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { SavePdfButton } from '@/components/shared/SavePdfButton';
import { useAuth } from '@/contexts/AuthContext';
import { getSchool } from '@/services/schools.service';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses, listSessions } from '@/services/academics.service';
import { listStudents } from '@/services/students.service';
import { listTeachers } from '@/services/teachers.service';
import {
  createTemplate,
  fillTemplate,
  issueCertificate,
  listIssuedCertificates,
  listTemplates,
} from '@/services/certificates.service';
import { CERTIFICATE_TYPES } from '@/types/certificates';
import type { CertificateTemplate, CertificateType, IssuedCertificate } from '@/types/certificates';
import type { AcademicSession, ClassEntity } from '@/types/academics';
import type { Student, Teacher } from '@/types/people';
import { PageHeader } from '@/components/shared/PageHeader';

const certStyles = StyleSheet.create({
  page: { padding: 56, fontFamily: 'Helvetica' },
  footer: { position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: '#999' },
  schoolName: { fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 4 },
  logo: { width: 52, height: 52, marginBottom: 8, alignSelf: 'center', objectFit: 'contain' },
  title: { fontSize: 14, textAlign: 'center', marginBottom: 24, textDecoration: 'underline' },
  certNumber: { fontSize: 9, color: '#666', marginBottom: 20 },
  body: { fontSize: 12, lineHeight: 1.8, marginBottom: 40 },
  dateLine: { fontSize: 11, marginTop: 40 },
  signature: { marginTop: 60, textAlign: 'right', fontSize: 11 },
});

function CertificateDocument({ schoolName, schoolLogoUrl, typeLabel, certificateNumber, bodyText, issuedDate }: { schoolName: string; schoolLogoUrl: string | null; typeLabel: string; certificateNumber: string; bodyText: string; issuedDate: string }) {
  return (
    <Document>
      <Page size="A4" style={certStyles.page}>
        {schoolLogoUrl && <Image src={schoolLogoUrl} style={certStyles.logo} />}
        <Text style={certStyles.schoolName}>{schoolName}</Text>
        <Text style={certStyles.title}>{typeLabel}</Text>
        <Text style={certStyles.certNumber}>Certificate No: {certificateNumber}</Text>
        <Text style={certStyles.body}>{bodyText}</Text>
        <Text style={certStyles.dateLine}>Date: {issuedDate}</Text>
        <Text style={certStyles.signature}>_______________________{'\n'}Principal</Text>
        <Text style={certStyles.footer} fixed>Powered by AURAED SCHOOL</Text>
      </Page>
    </Document>
  );
}

const idCardStyles = StyleSheet.create({
  page: { padding: 0 },
  footer: { fontSize: 5, color: '#888', textAlign: 'center', marginTop: 4 },
  card: { width: 260, height: 160, margin: 20, padding: 14, borderWidth: 1.5, borderColor: '#1d4ed8', borderRadius: 6, fontFamily: 'Helvetica' },
  header: { fontSize: 11, fontWeight: 700, color: '#1d4ed8', textAlign: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 },
  logo: { width: 16, height: 16, objectFit: 'contain' },
  name: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  line: { fontSize: 9, color: '#333', marginBottom: 2 },
});

function IdCardDocument({ schoolName, schoolLogoUrl, name, role, idNumber, extra }: { schoolName: string; schoolLogoUrl: string | null; name: string; role: string; idNumber: string; extra: string }) {
  return (
    <Document>
      <Page size={[300, 200]} style={idCardStyles.page}>
        <View style={idCardStyles.card}>
          <View style={idCardStyles.headerRow}>
            {schoolLogoUrl && <Image src={schoolLogoUrl} style={idCardStyles.logo} />}
            <Text style={idCardStyles.header}>{schoolName} — ID CARD</Text>
          </View>
          <Text style={idCardStyles.name}>{name}</Text>
          <Text style={idCardStyles.line}>{role}</Text>
          <Text style={idCardStyles.line}>ID: {idNumber}</Text>
          {extra && <Text style={idCardStyles.line}>{extra}</Text>}
          <Text style={idCardStyles.footer}>Powered by AURAED SCHOOL</Text>
        </View>
      </Page>
    </Document>
  );
}

function CertificatesTab() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [issued, setIssued] = useState<IssuedCertificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastIssued, setLastIssued] = useState<IssuedCertificate | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<CertificateType>('bonafide');
  const [templateBody, setTemplateBody] = useState(CERTIFICATE_TYPES[0].defaultBody);

  const [issueStudentId, setIssueStudentId] = useState('');
  const [issueTemplateId, setIssueTemplateId] = useState('');
  const [previewText, setPreviewText] = useState('');

  async function loadAll() {
    if (!profile?.schoolId) return;
    const [t, i, s, c, sess, school] = await Promise.all([
      listTemplates(profile.schoolId),
      listIssuedCertificates(profile.schoolId),
      listStudents(profile.schoolId),
      listClasses(profile.schoolId),
      listSessions(profile.schoolId),
      getSchool(profile.schoolId),
    ]);
    setTemplates(t);
    setIssued(i);
    setStudents(s.filter((x) => x.status === 'active'));
    setClasses(c);
    setSessions(sess);
    setSchoolName(school?.name ?? '');
    setSchoolLogoUrl(school?.logoUrl ?? null);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleCreateTemplate() {
    if (!profile?.schoolId || !templateName.trim() || !templateBody.trim()) return;
    setErrorMsg(null);
    try {
      await createTemplate({ schoolId: profile.schoolId, name: templateName, certificateType: templateType, bodyTemplate: templateBody });
      setTemplateName('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to create template.'));
    }
  }

  function buildPreview(studentId: string, templateId: string) {
    const student = students.find((s) => s.id === studentId);
    const template = templates.find((t) => t.id === templateId);
    if (!student || !template) {
      setPreviewText('');
      return;
    }
    const className = classes.find((c) => c.id === student.classId)?.name ?? '';
    const session = sessions.find((s) => s.isCurrent) ?? sessions[0];
    setPreviewText(
      fillTemplate(template.bodyTemplate, {
        student_name: `${student.firstName} ${student.lastName}`,
        admission_number: student.admissionNumber,
        school_name: schoolName,
        class: className,
        session: session?.name ?? '',
        date: new Date().toISOString().slice(0, 10),
      })
    );
  }

  async function handleIssue() {
    if (!profile?.schoolId || !issueStudentId || !issueTemplateId || !previewText.trim()) return;
    setErrorMsg(null);
    try {
      const template = templates.find((t) => t.id === issueTemplateId)!;
      const cert = await issueCertificate({
        schoolId: profile.schoolId,
        studentId: issueStudentId,
        templateId: issueTemplateId,
        certificateType: template.certificateType,
        bodyText: previewText,
      });
      setLastIssued(cert);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to issue certificate.'));
    }
  }

  return (
    <div>
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <PermissionGate code="certificates.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Certificate templates</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <input className="input" placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            <select
              className="input"
              value={templateType}
              onChange={(e) => {
                const t = e.target.value as CertificateType;
                setTemplateType(t);
                setTemplateBody(CERTIFICATE_TYPES.find((c) => c.value === t)?.defaultBody ?? '');
              }}
            >
              {CERTIFICATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <textarea
            className="input mb-3 w-full"
            rows={3}
            placeholder="Body text — use {{student_name}}, {{admission_number}}, {{school_name}}, {{class}}, {{session}}, {{date}}"
            value={templateBody}
            onChange={(e) => setTemplateBody(e.target.value)}
          />
          <button onClick={handleCreateTemplate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Save template
          </button>

          {templates.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-800">
              {templates.map((t) => <li key={t.id}>{t.name} ({t.certificateType})</li>)}
            </ul>
          )}
        </section>

        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Issue certificate</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <select
              className="input"
              value={issueStudentId}
              onChange={(e) => { setIssueStudentId(e.target.value); buildPreview(e.target.value, issueTemplateId); }}
            >
              <option value="">Student…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
            </select>
            <select
              className="input"
              value={issueTemplateId}
              onChange={(e) => { setIssueTemplateId(e.target.value); buildPreview(issueStudentId, e.target.value); }}
            >
              <option value="">Template…</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {previewText && (
            <div className="mb-3 rounded-md bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">{previewText}</div>
          )}
          <button onClick={handleIssue} disabled={!previewText} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
            Issue certificate
          </button>

          {lastIssued && (
            <div className="mt-3 rounded-md bg-green-50 p-3 text-sm dark:bg-green-950">
              <p className="mb-2 text-green-700 dark:text-green-400">Issued: {lastIssued.certificateNumber}</p>
              <SavePdfButton
                document={
                  <CertificateDocument
                    schoolName={schoolName}
                    schoolLogoUrl={schoolLogoUrl}
                    typeLabel={CERTIFICATE_TYPES.find((t) => t.value === lastIssued.certificateType)?.label ?? lastIssued.certificateType}
                    certificateNumber={lastIssued.certificateNumber}
                    bodyText={lastIssued.bodyText}
                    issuedDate={lastIssued.issuedDate}
                  />
                }
                fileName={`${lastIssued.certificateNumber}.pdf`}
                label="Download PDF"
                className="text-primary-600 hover:underline"
              />
            </div>
          )}
        </section>
      </PermissionGate>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Issued certificates</h2>
        {issued.length === 0 ? (
          <p className="text-sm text-gray-500">None issued yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            {issued.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-3 py-2">
                <span>{c.certificateNumber} · {c.studentName} · {c.certificateType}</span>
                <span className="text-xs text-gray-500">{c.issuedDate}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function IdCardsTab() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [personType, setPersonType] = useState<'student' | 'teacher'>('student');
  const [personId, setPersonId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.schoolId) return;
    listStudents(profile.schoolId).then((s) => setStudents(s.filter((x) => x.status === 'active')));
    listTeachers(profile.schoolId).then((t) => setTeachers(t.filter((x) => x.status === 'active')));
    listClasses(profile.schoolId).then(setClasses);
    getSchool(profile.schoolId).then((s) => { setSchoolName(s?.name ?? ''); setSchoolLogoUrl(s?.logoUrl ?? null); });
  }, [profile?.schoolId]);

  const student = personType === 'student' ? students.find((s) => s.id === personId) : null;
  const teacher = personType === 'teacher' ? teachers.find((t) => t.id === personId) : null;
  const className = student ? classes.find((c) => c.id === student.classId)?.name ?? '' : '';

  return (
    <PermissionGate code="certificates.view" fallback={<p className="text-sm text-gray-500">You don't have permission to view this.</p>}>
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="input" value={personType} onChange={(e) => { setPersonType(e.target.value as 'student' | 'teacher'); setPersonId(''); }}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <select className="input" value={personId} onChange={(e) => setPersonId(e.target.value)}>
          <option value="">Select…</option>
          {(personType === 'student' ? students : teachers).map((p) => (
            <option key={p.id} value={p.id}>{'firstName' in p ? `${p.firstName} ${p.lastName}` : p.fullName}</option>
          ))}
        </select>
      </div>

      {(student || teacher) && (
        <SavePdfButton
          document={
            <IdCardDocument
              schoolName={schoolName}
              schoolLogoUrl={schoolLogoUrl}
              name={student ? `${student.firstName} ${student.lastName}` : teacher!.fullName}
              role={student ? `Student — ${className}` : 'Teacher'}
              idNumber={student ? student.admissionNumber : teacher!.employeeId}
              extra=""
            />
          }
          fileName={`id-card-${student ? student.admissionNumber : teacher!.employeeId}.pdf`}
          label="Download ID Card"
          className="inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        />
      )}
    </PermissionGate>
  );
}

function CertificatesInner() {
  const [tab, setTab] = useState<'certificates' | 'idcards'>('certificates');

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Certificates & ID Cards" />
      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['certificates', 'idcards'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t === 'certificates' ? 'Certificates' : 'ID Cards'}
          </button>
        ))}
      </div>

      {tab === 'certificates' ? (
        <FeatureGate feature="certificates">
          <CertificatesTab />
        </FeatureGate>
      ) : (
        <FeatureGate feature="id_cards">
          <IdCardsTab />
        </FeatureGate>
      )}
    </div>
  );
}

export function CertificatesPage() {
  return <CertificatesInner />;
}
