import { useEffect, useState } from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { SavePdfButton } from '@/components/shared/SavePdfButton';
import { supabase } from '@/lib/supabase';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listPaymentsForStudentFee, listStudentFees, recordPayment } from '@/services/fees.service';
import type { Payment, PaymentMethod, StudentFee } from '@/types/fees';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'cheque', 'card', 'online', 'upi', 'bank_transfer'];

const statusStyles: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const receiptStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  footer: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: '#999' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 12, textAlign: 'center' },
  logo: { width: 40, height: 40, marginBottom: 4, alignSelf: 'center', objectFit: 'contain' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  box: { marginTop: 16, borderWidth: 1, borderColor: '#ccc', padding: 12 },
});

function ReceiptDocument({
  receiptNumber,
  schoolName,
  schoolLogoUrl,
  studentName,
  amount,
  paymentMethod,
  paymentDate,
  categoryName,
}: {
  receiptNumber: string;
  schoolName: string;
  schoolLogoUrl: string | null;
  studentName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  categoryName?: string;
}) {
  return (
    <Document>
      <Page size="A5" style={receiptStyles.page}>
        {schoolLogoUrl && <Image src={schoolLogoUrl} style={receiptStyles.logo} />}
        <Text style={receiptStyles.title}>{schoolName} — Payment Receipt</Text>
        <View style={receiptStyles.box}>
          <View style={receiptStyles.row}>
            <Text>Receipt No.</Text>
            <Text>{receiptNumber}</Text>
          </View>
          <View style={receiptStyles.row}>
            <Text>Date</Text>
            <Text>{paymentDate}</Text>
          </View>
          <View style={receiptStyles.row}>
            <Text>Student</Text>
            <Text>{studentName}</Text>
          </View>
          <View style={receiptStyles.row}>
            <Text>Fee Category</Text>
            <Text>{categoryName ?? '-'}</Text>
          </View>
          <View style={receiptStyles.row}>
            <Text>Payment Method</Text>
            <Text>{paymentMethod}</Text>
          </View>
          <View style={receiptStyles.row}>
            <Text style={{ fontWeight: 700 }}>Amount Paid</Text>
            <Text style={{ fontWeight: 700 }}>₹{amount}</Text>
          </View>
        </View>

        <Text style={receiptStyles.footer} fixed>Powered by AURAED SCHOOL</Text>
      </Page>
    </Document>
  );
}

function StudentFeesSummaryInner({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [paymentsByFee, setPaymentsByFee] = useState<Record<string, Payment[]>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});
  const [payMethod, setPayMethod] = useState<Record<string, PaymentMethod>>({});

  async function load(schoolId: string) {
    setLoading(true);
    try {
      const feeLines = await listStudentFees(schoolId, studentId);
      setFees(feeLines);
      const paymentsMap: Record<string, Payment[]> = {};
      for (const f of feeLines) {
        paymentsMap[f.id] = await listPaymentsForStudentFee(f.id);
      }
      setPaymentsByFee(paymentsMap);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load fees.'));
    } finally {
      setLoading(false);
    }
  }

  // We need the school_id — resolve it from the student's fee rows once
  // loaded isn't ideal, so instead read it via a tiny inline fetch on mount.
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase
      .from('students')
      .select('school_id, schools(name, logo_url)')
      .eq('id', studentId)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (data?.school_id) {
          setSchoolId(data.school_id);
          setSchoolName(data.schools?.name ?? '');
          setSchoolLogoUrl(data.schools?.logo_url ?? null);
          load(data.school_id);
        } else {
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function handlePay(fee: StudentFee) {
    if (!schoolId) return;
    const amountStr = payAmount[fee.id];
    if (!amountStr) return;
    setErrorMsg(null);
    try {
      await recordPayment({
        schoolId,
        studentFeeId: fee.id,
        amount: Number(amountStr),
        paymentMethod: payMethod[fee.id] ?? 'cash',
      });
      setPayAmount((prev) => ({ ...prev, [fee.id]: '' }));
      load(schoolId);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to record payment.'));
    }
  }

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Fees</h2>

      {errorMsg && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : fees.length === 0 ? (
        <p className="text-sm text-gray-500">No fees assigned to this student yet.</p>
      ) : (
        <ul className="space-y-3">
          {fees.map((f) => {
            const payable = f.amountDue - f.discount;
            const balance = payable - f.amountPaid;
            return (
              <li key={f.id} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-50">{f.categoryName}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[f.status]}`}>{f.status}</span>
                </div>
                <p className="mb-2 text-xs text-gray-500">
                  Due ₹{payable} · Paid ₹{f.amountPaid} · Balance ₹{balance}
                  {f.dueDate && ` · By ${f.dueDate}`}
                </p>

                {balance > 0 && (
                  <PermissionGate code="payments.create">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <input
                        type="number"
                        className="input w-28 py-1"
                        placeholder="Amount"
                        value={payAmount[f.id] ?? ''}
                        onChange={(e) => setPayAmount((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      />
                      <select
                        className="input w-32 py-1"
                        value={payMethod[f.id] ?? 'cash'}
                        onChange={(e) => setPayMethod((prev) => ({ ...prev, [f.id]: e.target.value as PaymentMethod }))}
                      >
                        {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <button
                        onClick={() => handlePay(f)}
                        className="rounded-md bg-primary-600 px-3 py-1 text-white hover:bg-primary-700"
                      >
                        Record payment
                      </button>
                    </div>
                  </PermissionGate>
                )}

                {(paymentsByFee[f.id] ?? []).length > 0 && (
                  <ul className="space-y-1">
                    {paymentsByFee[f.id].map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          {p.receiptNumber} · ₹{p.amount} · {p.paymentMethod} · {p.paymentDate}
                        </span>
                        <SavePdfButton
                          document={
                            <ReceiptDocument
                              receiptNumber={p.receiptNumber}
                              schoolName={schoolName}
                              schoolLogoUrl={schoolLogoUrl}
                              studentName={studentName}
                              amount={p.amount}
                              paymentMethod={p.paymentMethod}
                              paymentDate={p.paymentDate}
                              categoryName={f.categoryName}
                            />
                          }
                          fileName={`receipt-${p.receiptNumber}.pdf`}
                          label="Receipt"
                          className="text-primary-600 hover:underline"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function StudentFeesSummary(props: { studentId: string; studentName: string }) {
  return (
    <FeatureGate feature="fees">
      <StudentFeesSummaryInner {...props} />
    </FeatureGate>
  );
}
