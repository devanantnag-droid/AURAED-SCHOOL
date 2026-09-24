import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { isNativeApp } from '@/lib/platform';
import { MobileReports } from '@/components/mobile/MobileReports';
import { listExams } from '@/services/exams.service';
import {
  downloadCsv,
  downloadXlsx,
  exportAttendance,
  exportFeeCollection,
  exportMarks,
  exportPayroll,
  exportStudents,
  getDashboardSummary,
} from '@/services/reports.service';
import { getSchool } from '@/services/schools.service';
import { SavePdfButton } from '@/components/shared/SavePdfButton';
import { TableReportPdf } from '@/components/shared/TableReportPdf';
import { MONTH_NAMES } from '@/types/payroll';
import type { DashboardSummary } from '@/services/reports.service';
import type { Exam } from '@/types/exams';
import { PageHeader } from '@/components/shared/PageHeader';

function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-50">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function DashboardTab() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.schoolId) return;
    getDashboardSummary(profile.schoolId)
      .then(setSummary)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load summary.')));
  }, [profile?.schoolId]);

  if (errorMsg) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>;
  if (!summary) return <p className="text-sm text-gray-500">Loading…</p>;

  const attendancePct = summary.totalMarkedToday > 0 ? Math.round((summary.presentToday / summary.totalMarkedToday) * 100) : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <SummaryCard label="Active Students" value={summary.totalStudents} />
      <SummaryCard label="Active Teachers" value={summary.totalTeachers} />
      <SummaryCard label="Active Staff" value={summary.totalStaff} />
      <SummaryCard
        label="Attendance Today"
        value={attendancePct !== null ? `${attendancePct}%` : 'Not marked'}
        sub={summary.totalMarkedToday > 0 ? `${summary.presentToday} / ${summary.totalMarkedToday} present` : undefined}
      />
      <SummaryCard label="Fees Collected (Month)" value={`₹${summary.feesCollectedThisMonth.toFixed(2)}`} />
      <SummaryCard label="Fees Pending" value={`₹${summary.feesPendingTotal.toFixed(2)}`} />
      <SummaryCard label="Low Stock Items" value={summary.lowStockItemsCount} />
      <SummaryCard label="Events (Next 7 Days)" value={summary.upcomingEventsCount} />
    </div>
  );
}

type ReportResult = { headers: string[]; rows: (string | number)[][] };

function ReportButtons({
  reportKey,
  label,
  fetchFn,
  disabled,
  results,
  setResults,
  busy,
  setBusy,
  setErrorMsg,
  schoolName,
  schoolLogoUrl,
}: {
  reportKey: string;
  label: string;
  fetchFn: () => Promise<ReportResult>;
  disabled?: boolean;
  results: Record<string, ReportResult | undefined>;
  setResults: Dispatch<SetStateAction<Record<string, ReportResult | undefined>>>;
  busy: string | null;
  setBusy: (key: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  schoolName: string;
  schoolLogoUrl: string | null;
}) {
  const result = results[reportKey];

  async function handleGenerate() {
    setErrorMsg(null);
    setBusy(reportKey);
    try {
      const data = await fetchFn();
      if (data.rows.length === 0) {
        setErrorMsg('No data found for that selection.');
        setResults((prev) => ({ ...prev, [reportKey]: undefined }));
        return;
      }
      setResults((prev) => ({ ...prev, [reportKey]: data }));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to generate the report.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={disabled || busy === reportKey}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {busy === reportKey ? 'Generating…' : 'Generate'}
      </button>

      {result && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">{result.rows.length} row{result.rows.length === 1 ? '' : 's'} ready:</span>
          <button
            onClick={() => downloadCsv(`${reportKey}.csv`, result.headers, result.rows)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            CSV
          </button>
          <button
            onClick={() => downloadXlsx(`${reportKey}.xlsx`, result.headers, result.rows)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Excel
          </button>
          <SavePdfButton
            document={<TableReportPdf title={label} schoolName={schoolName} schoolLogoUrl={schoolLogoUrl} headers={result.headers} rows={result.rows} />}
            fileName={`${reportKey}.pdf`}
            label="PDF"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          />
        </div>
      )}
    </div>
  );
}

function ExportTab() {
  const { profile } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Record<string, ReportResult | undefined>>({});
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);

  const [attFrom, setAttFrom] = useState('');
  const [attTo, setAttTo] = useState('');
  const [feeFrom, setFeeFrom] = useState('');
  const [feeTo, setFeeTo] = useState('');
  const [examId, setExamId] = useState('');
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!profile?.schoolId) return;
    listExams(profile.schoolId).then((e) => {
      setExams(e);
      if (e.length > 0) setExamId(e[0].id);
    });
    getSchool(profile.schoolId).then((s) => {
      setSchoolName(s?.name ?? '');
      setSchoolLogoUrl(s?.logoUrl ?? null);
    });
  }, [profile?.schoolId]);

  return (
    <div className="space-y-4">
      {errorMsg && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <section className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Students</h2>
        <p className="mb-3 text-xs text-gray-500">All active and archived students, with class/section.</p>
        <ReportButtons
          reportKey="students"
          label="Students"
          fetchFn={() => exportStudents(profile!.schoolId!)}
          results={results}
          setResults={setResults}
          busy={busy}
          setBusy={setBusy}
          setErrorMsg={setErrorMsg}
          schoolName={schoolName}
          schoolLogoUrl={schoolLogoUrl}
        />
      </section>

      <section className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Attendance</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <input type="date" className="input" value={attFrom} onChange={(e) => setAttFrom(e.target.value)} />
          <input type="date" className="input" value={attTo} onChange={(e) => setAttTo(e.target.value)} />
        </div>
        <ReportButtons
          reportKey="attendance"
          label="Attendance"
          fetchFn={() => exportAttendance(profile!.schoolId!, attFrom, attTo)}
          disabled={!attFrom || !attTo}
          results={results}
          setResults={setResults}
          busy={busy}
          setBusy={setBusy}
          setErrorMsg={setErrorMsg}
          schoolName={schoolName}
          schoolLogoUrl={schoolLogoUrl}
        />
      </section>

      <section className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Fee Collection</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <input type="date" className="input" value={feeFrom} onChange={(e) => setFeeFrom(e.target.value)} />
          <input type="date" className="input" value={feeTo} onChange={(e) => setFeeTo(e.target.value)} />
        </div>
        <ReportButtons
          reportKey="fee-collection"
          label="Fee Collection"
          fetchFn={() => exportFeeCollection(profile!.schoolId!, feeFrom, feeTo)}
          disabled={!feeFrom || !feeTo}
          results={results}
          setResults={setResults}
          busy={busy}
          setBusy={setBusy}
          setErrorMsg={setErrorMsg}
          schoolName={schoolName}
          schoolLogoUrl={schoolLogoUrl}
        />
      </section>

      <section className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Exam Results</h2>
        <div className="mb-3">
          <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
            {exams.length === 0 && <option value="">No exams yet</option>}
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <ReportButtons
          reportKey="exam-results"
          label="Exam Results"
          fetchFn={() => exportMarks(profile!.schoolId!, examId)}
          disabled={!examId}
          results={results}
          setResults={setResults}
          busy={busy}
          setBusy={setBusy}
          setErrorMsg={setErrorMsg}
          schoolName={schoolName}
          schoolLogoUrl={schoolLogoUrl}
        />
      </section>

      <section className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Payroll</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <select className="input" value={payrollMonth} onChange={(e) => setPayrollMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" className="input" value={payrollYear} onChange={(e) => setPayrollYear(Number(e.target.value))} />
        </div>
        <ReportButtons
          reportKey="payroll"
          label="Payroll"
          fetchFn={() => exportPayroll(profile!.schoolId!, payrollMonth, payrollYear)}
          results={results}
          setResults={setResults}
          busy={busy}
          setBusy={setBusy}
          setErrorMsg={setErrorMsg}
          schoolName={schoolName}
          schoolLogoUrl={schoolLogoUrl}
        />
      </section>
    </div>
  );
}

function ReportsInner() {
  const [tab, setTab] = useState<'dashboard' | 'export'>('dashboard');

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Reports & Export" />
      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['dashboard', 'export'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 capitalize ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' ? <DashboardTab /> : <ExportTab />}
    </div>
  );
}

export function ReportsPage() {
  if (isNativeApp()) {
    return <MobileReports />;
  }
  return (
    <FeatureGate feature="reports">
      <PermissionGate code="reports.manage" fallback={<p className="mx-auto max-w-3xl p-6 text-sm text-gray-500">You don't have permission to view reports.</p>}>
        <ReportsInner />
      </PermissionGate>
    </FeatureGate>
  );
}
