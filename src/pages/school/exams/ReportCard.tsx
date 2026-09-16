import { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses, listSections } from '@/services/academics.service';
import { listStudents } from '@/services/students.service';
import { listExams } from '@/services/exams.service';
import { getReportCardData, type ReportCardRow } from '@/services/exams.service';
import { getStudentAttendancePercentage } from '@/services/attendance.service';
import type { ClassEntity, Section } from '@/types/academics';
import type { Exam } from '@/types/exams';
import type { Student } from '@/types/people';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 16 },
  schoolName: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  reportTitle: { fontSize: 12, color: '#555', marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  table: { marginTop: 12, borderWidth: 1, borderColor: '#ccc' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
  tableHeaderCell: { flex: 1, padding: 6, fontWeight: 700, backgroundColor: '#f0f0f0' },
  tableCell: { flex: 1, padding: 6 },
  summary: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  signatureRow: { marginTop: 48, flexDirection: 'row', justifyContent: 'space-between' },
  signatureLine: { borderTopWidth: 1, borderTopColor: '#333', width: 140, textAlign: 'center', paddingTop: 4 },
});

function ReportCardDocument({
  schoolName,
  studentName,
  admissionNumber,
  className,
  sectionName,
  examName,
  rows,
  attendancePercentage,
}: {
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  examName: string;
  rows: ReportCardRow[];
  attendancePercentage: number | null;
}) {
  const totalObtained = rows.reduce((sum, r) => sum + (r.marksObtained ?? 0), 0);
  const totalMax = rows.reduce((sum, r) => sum + r.maxMarks, 0);
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
  const overallResult = rows.every((r) => (r.marksObtained ?? 0) >= r.passingMarks) ? 'PASS' : 'NEEDS IMPROVEMENT';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          <Text style={styles.reportTitle}>Report Card · {examName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text>Student: {studentName}</Text>
          <Text>Admission #: {admissionNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text>Class: {className} - {sectionName}</Text>
          <Text>Attendance: {attendancePercentage !== null ? `${attendancePercentage}%` : 'N/A'}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableHeaderCell}>Subject</Text>
            <Text style={styles.tableHeaderCell}>Marks Obtained</Text>
            <Text style={styles.tableHeaderCell}>Max Marks</Text>
            <Text style={styles.tableHeaderCell}>Result</Text>
          </View>
          {rows.map((r, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.tableCell}>{r.subjectName}</Text>
              <Text style={styles.tableCell}>{r.marksObtained ?? '-'}</Text>
              <Text style={styles.tableCell}>{r.maxMarks}</Text>
              <Text style={styles.tableCell}>
                {r.marksObtained !== null ? (r.marksObtained >= r.passingMarks ? 'Pass' : 'Fail') : '-'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <Text>Total: {totalObtained} / {totalMax}</Text>
          <Text>Percentage: {percentage}%</Text>
          <Text>Overall: {overallResult}</Text>
        </View>

        <View style={styles.signatureRow}>
          <Text style={styles.signatureLine}>Class Teacher</Text>
          <Text style={styles.signatureLine}>Principal</Text>
          <Text style={styles.signatureLine}>Parent/Guardian</Text>
        </View>
      </Page>
    </Document>
  );
}

function ReportCardInner() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [examId, setExamId] = useState('');
  const [rows, setRows] = useState<ReportCardRow[] | null>(null);
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.schoolId) return;
    Promise.all([listClasses(profile.schoolId), listExams(profile.schoolId), listStudents(profile.schoolId)]).then(
      ([c, ex, allStudents]) => {
        setClasses(c);
        setExams(ex);
        setStudents(allStudents);
        if (ex.length > 0) setExamId(ex[0].id);
      }
    );
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !classId) return;
    listSections(profile.schoolId, classId).then(setSections);
  }, [profile?.schoolId, classId]);

  const filteredStudents = students.filter((s) => s.classId === classId && s.sectionId === sectionId && s.status === 'active');
  const selectedStudent = students.find((s) => s.id === studentId);

  async function handleGenerate() {
    if (!examId || !studentId || !classId || !sectionId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [data, pct] = await Promise.all([
        getReportCardData(examId, studentId, classId, sectionId),
        getStudentAttendancePercentage(studentId),
      ]);
      if (data.length === 0) {
        setErrorMsg('No exam papers found for this exam in this class/section yet.');
        setRows(null);
      } else {
        setRows(data);
        setAttendancePct(pct);
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to generate report card.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-50">Report Cards</h1>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(''); setStudentId(''); }}>
          <option value="">Class…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={sectionId} onChange={(e) => { setSectionId(e.target.value); setStudentId(''); }} disabled={!classId}>
          <option value="">Section…</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!sectionId}>
          <option value="">Student…</option>
          {filteredStudents.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!examId || !studentId || loading}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Generate report card'}
      </button>

      {rows && selectedStudent && (
        <div className="mt-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Preview ready for <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong> —{' '}
            {rows.length} subject(s) found.
          </p>
          <PDFDownloadLink
            document={
              <ReportCardDocument
                schoolName="AURAED SCHOOL"
                studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                admissionNumber={selectedStudent.admissionNumber}
                className={classes.find((c) => c.id === classId)?.name ?? ''}
                sectionName={sections.find((s) => s.id === sectionId)?.name ?? ''}
                examName={exams.find((e) => e.id === examId)?.name ?? ''}
                rows={rows}
                attendancePercentage={attendancePct}
              />
            }
            fileName={`report-card-${selectedStudent.admissionNumber}.pdf`}
            className="inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {({ loading: pdfLoading }) => (pdfLoading ? 'Preparing PDF…' : 'Download PDF')}
          </PDFDownloadLink>
        </div>
      )}
    </div>
  );
}

export function ReportCardPage() {
  return (
    <FeatureGate feature="results">
      <ReportCardInner />
    </FeatureGate>
  );
}
