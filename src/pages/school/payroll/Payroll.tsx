import { useEffect, useState } from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { SavePdfButton } from '@/components/shared/SavePdfButton';
import { useAuth } from '@/contexts/AuthContext';
import { getSchool } from '@/services/schools.service';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import {
  generatePayslip,
  getSalaryStructure,
  listEmployees,
  listPayslips,
  markPayslipPaid,
  upsertSalaryStructure,
} from '@/services/payroll.service';
import { MONTH_NAMES } from '@/types/payroll';
import type { Employee, Payslip } from '@/types/payroll';
import { PageHeader } from '@/components/shared/PageHeader';

const payslipStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: 'Helvetica' },
  footer: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: '#999' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 12, textAlign: 'center' },
  logo: { width: 40, height: 40, marginBottom: 4, alignSelf: 'center', objectFit: 'contain' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  box: { marginTop: 16, borderWidth: 1, borderColor: '#ccc', padding: 12 },
  netRow: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 8 },
});

function PayslipDocument({ schoolName, schoolLogoUrl, employeeName, month, year, payslip }: { schoolName: string; schoolLogoUrl: string | null; employeeName: string; month: string; year: number; payslip: Payslip }) {
  return (
    <Document>
      <Page size="A5" style={payslipStyles.page}>
        {schoolLogoUrl && <Image src={schoolLogoUrl} style={payslipStyles.logo} />}
        <Text style={payslipStyles.title}>{schoolName} — Payslip</Text>
        <View style={payslipStyles.box}>
          <View style={payslipStyles.row}><Text>Employee</Text><Text>{employeeName}</Text></View>
          <View style={payslipStyles.row}><Text>Period</Text><Text>{month} {year}</Text></View>
          <View style={payslipStyles.row}><Text>Basic Salary</Text><Text>₹{payslip.basicSalary}</Text></View>
          <View style={payslipStyles.row}><Text>Allowances</Text><Text>+ ₹{payslip.allowances}</Text></View>
          <View style={payslipStyles.row}><Text>Deductions</Text><Text>- ₹{payslip.deductions}</Text></View>
          {payslip.additionalDeduction > 0 && (
            <View style={payslipStyles.row}><Text>Additional Deduction</Text><Text>- ₹{payslip.additionalDeduction}</Text></View>
          )}
          <View style={[payslipStyles.row, payslipStyles.netRow]}>
            <Text style={{ fontWeight: 700 }}>Net Salary</Text>
            <Text style={{ fontWeight: 700 }}>₹{payslip.netSalary}</Text>
          </View>
          <View style={payslipStyles.row}><Text>Status</Text><Text>{payslip.status}</Text></View>
        </View>

        <Text style={payslipStyles.footer} fixed>Powered by AURAED SCHOOL</Text>
      </Page>
    </Document>
  );
}

function PayrollInner() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'structures' | 'payslips'>('structures');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);

  const [selectedEmployeeKey, setSelectedEmployeeKey] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState('');
  const [deductions, setDeductions] = useState('');

  const [genEmployeeKey, setGenEmployeeKey] = useState('');
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genAdditionalDeduction, setGenAdditionalDeduction] = useState('0');

  const selectedEmployee = employees.find((e) => `${e.type}:${e.id}` === selectedEmployeeKey) ?? null;
  const genEmployee = employees.find((e) => `${e.type}:${e.id}` === genEmployeeKey) ?? null;

  async function loadEmployees() {
    if (!profile?.schoolId) return;
    const list = await listEmployees(profile.schoolId);
    setEmployees(list);
    if (list.length > 0) {
      setSelectedEmployeeKey(`${list[0].type}:${list[0].id}`);
      setGenEmployeeKey(`${list[0].type}:${list[0].id}`);
    }
  }

  async function loadPayslips() {
    if (!profile?.schoolId) return;
    setPayslips(await listPayslips(profile.schoolId));
  }

  useEffect(() => {
    loadEmployees();
    loadPayslips();
    if (profile?.schoolId) getSchool(profile.schoolId).then((s) => { setSchoolName(s?.name ?? ''); setSchoolLogoUrl(s?.logoUrl ?? null); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!selectedEmployee) return;
    getSalaryStructure(selectedEmployee).then((s) => {
      setBasicSalary(s ? String(s.basicSalary) : '');
      setAllowances(s ? String(s.allowances) : '0');
      setDeductions(s ? String(s.deductions) : '0');
    });
  }, [selectedEmployeeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveStructure() {
    if (!profile?.schoolId || !selectedEmployee || !basicSalary) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await upsertSalaryStructure({
        schoolId: profile.schoolId,
        employee: selectedEmployee,
        basicSalary: Number(basicSalary),
        allowances: Number(allowances || 0),
        deductions: Number(deductions || 0),
      });
      setSuccessMsg(`Salary structure saved for ${selectedEmployee.fullName}.`);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to save salary structure.'));
    }
  }

  async function handleGenerate() {
    if (!profile?.schoolId || !genEmployee) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await generatePayslip({
        schoolId: profile.schoolId,
        employee: genEmployee,
        periodMonth: genMonth,
        periodYear: genYear,
        additionalDeduction: Number(genAdditionalDeduction || 0),
      });
      setSuccessMsg(`Payslip generated for ${genEmployee.fullName} — ${MONTH_NAMES[genMonth - 1]} ${genYear}.`);
      loadPayslips();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to generate payslip.'));
    }
  }

  async function handleMarkPaid(id: string) {
    setErrorMsg(null);
    try {
      await markPayslipPaid(id);
      loadPayslips();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update payslip.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Payroll" />
      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['structures', 'payslips'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t === 'structures' ? 'Salary Structures' : 'Payslips'}
          </button>
        ))}
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>
      )}
      {successMsg && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{successMsg}</p>
      )}

      {tab === 'structures' ? (
        <PermissionGate code="payroll.manage" fallback={<p className="text-sm text-gray-500">You don't have permission to manage payroll.</p>}>
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-500">Employee</label>
              <select className="input" value={selectedEmployeeKey} onChange={(e) => setSelectedEmployeeKey(e.target.value)}>
                {employees.map((e) => (
                  <option key={`${e.type}:${e.id}`} value={`${e.type}:${e.id}`}>
                    {e.fullName} ({e.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Basic salary</label>
                <input type="number" className="input" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Allowances</label>
                <input type="number" className="input" value={allowances} onChange={(e) => setAllowances(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Deductions</label>
                <input type="number" className="input" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
              </div>
            </div>
            <button onClick={handleSaveStructure} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Save salary structure
            </button>
          </div>
        </PermissionGate>
      ) : (
        <div>
          <PermissionGate code="payroll.manage">
            <div className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Generate payslip</h2>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select className="input" value={genEmployeeKey} onChange={(e) => setGenEmployeeKey(e.target.value)}>
                  {employees.map((e) => (
                    <option key={`${e.type}:${e.id}`} value={`${e.type}:${e.id}`}>
                      {e.fullName} ({e.type})
                    </option>
                  ))}
                </select>
                <select className="input" value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))}>
                  {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <input type="number" className="input" value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} />
                <input
                  type="number"
                  className="input"
                  placeholder="Extra deduction"
                  value={genAdditionalDeduction}
                  onChange={(e) => setGenAdditionalDeduction(e.target.value)}
                />
              </div>
              <button onClick={handleGenerate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Generate payslip
              </button>
            </div>
          </PermissionGate>

          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Payslips</h2>
          {payslips.length === 0 ? (
            <p className="text-sm text-gray-500">No payslips generated yet.</p>
          ) : (
            <ul className="space-y-2">
              {payslips.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{p.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      {MONTH_NAMES[p.periodMonth - 1]} {p.periodYear} · Net ₹{p.netSalary}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {p.status}
                    </span>
                    <SavePdfButton
                      document={
                        <PayslipDocument
                          schoolName={schoolName}
                          schoolLogoUrl={schoolLogoUrl}
                          employeeName={p.employeeName ?? ''}
                          month={MONTH_NAMES[p.periodMonth - 1]}
                          year={p.periodYear}
                          payslip={p}
                        />
                      }
                      fileName={`payslip-${p.employeeName}-${p.periodMonth}-${p.periodYear}.pdf`}
                      label="PDF"
                      className="text-primary-600 hover:underline"
                    />
                    {p.status === 'pending' && (
                      <PermissionGate code="payroll.manage">
                        <button onClick={() => handleMarkPaid(p.id)} className="text-green-700 hover:underline dark:text-green-400">
                          Mark paid
                        </button>
                      </PermissionGate>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function PayrollPage() {
  return (
    <FeatureGate feature="payroll">
      <PayrollInner />
    </FeatureGate>
  );
}
