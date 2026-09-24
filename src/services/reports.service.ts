import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export interface DashboardSummary {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  presentToday: number;
  totalMarkedToday: number;
  feesCollectedThisMonth: number;
  feesPendingTotal: number;
  lowStockItemsCount: number;
  upcomingEventsCount: number;
}

export async function getDashboardSummary(schoolId: string): Promise<DashboardSummary> {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + '-01';
  const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    students,
    teachers,
    staff,
    attendanceToday,
    payments,
    studentFees,
    inventoryItems,
    events,
  ] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('student_attendance').select('status').eq('school_id', schoolId).eq('attendance_date', today),
    supabase.from('payments').select('amount').eq('school_id', schoolId).eq('status', 'success').gte('payment_date', monthStart),
    supabase.from('student_fees').select('amount_due, discount, amount_paid').eq('school_id', schoolId).neq('status', 'paid'),
    supabase.from('inventory_items').select('id, quantity_in_stock, reorder_level').eq('school_id', schoolId),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).gte('event_date', today).lte('event_date', weekAhead),
  ]);

  const attendanceRows = attendanceToday.data ?? [];
  const presentToday = attendanceRows.filter((r) => r.status === 'present').length;

  const feesCollectedThisMonth = (payments.data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  const feesPendingTotal = (studentFees.data ?? []).reduce(
    (sum, r) => sum + (Number(r.amount_due) - Number(r.discount) - Number(r.amount_paid)),
    0
  );
  const lowStockItemsCount = (inventoryItems.data ?? []).filter((r) => r.quantity_in_stock <= r.reorder_level).length;

  return {
    totalStudents: students.count ?? 0,
    totalTeachers: teachers.count ?? 0,
    totalStaff: staff.count ?? 0,
    presentToday,
    totalMarkedToday: attendanceRows.length,
    feesCollectedThisMonth,
    feesPendingTotal,
    lowStockItemsCount,
    upcomingEventsCount: events.count ?? 0,
  };
}

// ---------- CSV export ----------

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csv = toCsv(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Builds a real .xlsx workbook (not just a renamed CSV) and saves it.
// Mirrors SavePdfButton's platform split exactly, since a plain <a
// download> link is inert inside the Android app - on native, write to
// the filesystem and hand it to the OS share sheet instead.
export async function downloadXlsx(filename: string, headers: string[], rows: (string | number)[][]): Promise<void> {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  const { isNativeApp } = await import('@/lib/platform');
  if (isNativeApp()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const written = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
    await Share.share({ title: filename, url: written.uri });
  } else {
    XLSX.writeFile(workbook, filename);
  }
}

export async function exportStudents(schoolId: string): Promise<{ headers: string[]; rows: (string | number)[][] }> {
  const { data, error } = await supabase
    .from('students')
    .select('admission_number, first_name, last_name, gender, date_of_birth, status, phone, classes(name), sections(name)')
    .eq('school_id', schoolId)
    .order('admission_number');
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => [
    r.admission_number, r.first_name, r.last_name, r.gender ?? '', r.date_of_birth ?? '',
    r.classes?.name ?? '', r.sections?.name ?? '', r.status, r.phone ?? '',
  ]);
  return { headers: ['Admission #', 'First Name', 'Last Name', 'Gender', 'DOB', 'Class', 'Section', 'Status', 'Phone'], rows };
}

export async function exportAttendance(schoolId: string, fromDate: string, toDate: string) {
  const { data, error } = await supabase
    .from('student_attendance')
    .select('attendance_date, status, class_name, section_name, students(admission_number, first_name, last_name)')
    .eq('school_id', schoolId)
    .gte('attendance_date', fromDate)
    .lte('attendance_date', toDate)
    .order('attendance_date');
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => [
    r.attendance_date, r.students?.admission_number ?? '', `${r.students?.first_name ?? ''} ${r.students?.last_name ?? ''}`.trim(),
    r.class_name ?? '', r.section_name ?? '', r.status,
  ]);
  return { headers: ['Date', 'Admission #', 'Student', 'Class', 'Section', 'Status'], rows };
}

export async function exportFeeCollection(schoolId: string, fromDate: string, toDate: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('receipt_number, amount, payment_method, payment_date, status, student_fees(students(admission_number, first_name, last_name))')
    .eq('school_id', schoolId)
    .gte('payment_date', fromDate)
    .lte('payment_date', toDate)
    .order('payment_date');
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => {
    const student = r.student_fees?.students;
    return [
      r.receipt_number, r.payment_date, student?.admission_number ?? '',
      `${student?.first_name ?? ''} ${student?.last_name ?? ''}`.trim(), Number(r.amount), r.payment_method, r.status,
    ];
  });
  return { headers: ['Receipt #', 'Date', 'Admission #', 'Student', 'Amount', 'Method', 'Status'], rows };
}

export async function exportMarks(schoolId: string, examId: string) {
  const { data, error } = await supabase
    .from('marks')
    .select('marks_obtained, students(admission_number, first_name, last_name), exam_subjects(max_marks, passing_marks, subjects(name), classes(name), sections(name))')
    .eq('school_id', schoolId)
    .in('exam_subject_id', (
      await supabase.from('exam_subjects').select('id').eq('school_id', schoolId).eq('exam_id', examId)
    ).data?.map((e) => e.id) ?? []);
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => [
    r.students?.admission_number ?? '', `${r.students?.first_name ?? ''} ${r.students?.last_name ?? ''}`.trim(),
    r.exam_subjects?.classes?.name ?? '', r.exam_subjects?.sections?.name ?? '', r.exam_subjects?.subjects?.name ?? '',
    r.marks_obtained ?? '', r.exam_subjects?.max_marks ?? '',
  ]);
  return { headers: ['Admission #', 'Student', 'Class', 'Section', 'Subject', 'Marks', 'Max Marks'], rows };
}

export async function exportPayroll(schoolId: string, month: number, year: number) {
  const { data, error } = await supabase
    .from('payslips')
    .select('net_salary, status, teachers(full_name), staff(full_name)')
    .eq('school_id', schoolId)
    .eq('period_month', month)
    .eq('period_year', year);
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => [
    r.teachers?.full_name ?? r.staff?.full_name ?? '', Number(r.net_salary), r.status,
  ]);
  return { headers: ['Employee', 'Net Salary', 'Status'], rows };
}
