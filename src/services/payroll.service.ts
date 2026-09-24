import { supabase } from '@/lib/supabase';
import { listTeachers } from '@/services/teachers.service';
import { listStaff } from '@/services/staff.service';
import type { Employee, Payslip, SalaryStructure } from '@/types/payroll';

// `salary_structures` and `payslips` use the dual-nullable-FK pattern
// (teacher_id/staff_id) established in Phase 11. A computed property key
// like `{ [column]: id }` can't be statically typed against the table's
// fixed shape, which is what was breaking strict type-checking here —
// this returns one of two fully-typed literal shapes instead.
function employeeIdColumns(employee: Employee): { teacher_id: string | null; staff_id: string | null } {
  return employee.type === 'teacher'
    ? { teacher_id: employee.id, staff_id: null }
    : { teacher_id: null, staff_id: employee.id };
}

export async function listEmployees(schoolId: string): Promise<Employee[]> {
  const [teachers, staff] = await Promise.all([listTeachers(schoolId), listStaff(schoolId)]);

  const teacherEmployees: Employee[] = teachers
    .filter((t) => t.status === 'active')
    .map((t) => ({ id: t.id, type: 'teacher', fullName: t.fullName, employeeId: t.employeeId }));

  const staffEmployees: Employee[] = staff
    .filter((s) => s.status === 'active')
    .map((s) => ({ id: s.id, type: 'staff', fullName: s.fullName, employeeId: s.employeeId }));

  return [...teacherEmployees, ...staffEmployees];
}

function mapSalaryRow(r: {
  id: string;
  teacher_id: string | null;
  staff_id: string | null;
  basic_salary: number;
  allowances: number;
  deductions: number;
  effective_from: string;
}): SalaryStructure {
  return {
    id: r.id,
    teacherId: r.teacher_id,
    staffId: r.staff_id,
    basicSalary: Number(r.basic_salary),
    allowances: Number(r.allowances),
    deductions: Number(r.deductions),
    effectiveFrom: r.effective_from,
  };
}

export async function getSalaryStructure(employee: Employee): Promise<SalaryStructure | null> {
  const column = employee.type === 'teacher' ? 'teacher_id' : 'staff_id';
  const { data, error } = await supabase.from('salary_structures').select('*').eq(column, employee.id).maybeSingle();
  if (error) throw error;
  return data ? mapSalaryRow(data) : null;
}

export async function upsertSalaryStructure(input: {
  schoolId: string;
  employee: Employee;
  basicSalary: number;
  allowances: number;
  deductions: number;
}): Promise<void> {
  const column = input.employee.type === 'teacher' ? 'teacher_id' : 'staff_id';
  const { error } = await supabase.from('salary_structures').upsert(
    {
      school_id: input.schoolId,
      ...employeeIdColumns(input.employee),
      basic_salary: input.basicSalary,
      allowances: input.allowances,
      deductions: input.deductions,
    },
    { onConflict: column }
  );
  if (error) throw error;
}

function mapPayslipRow(r: any): Payslip {
  return {
    id: r.id,
    teacherId: r.teacher_id,
    staffId: r.staff_id,
    employeeName: r.teachers?.full_name ?? r.staff?.full_name,
    periodMonth: r.period_month,
    periodYear: r.period_year,
    basicSalary: Number(r.basic_salary),
    allowances: Number(r.allowances),
    deductions: Number(r.deductions),
    additionalDeduction: Number(r.additional_deduction),
    netSalary: Number(r.net_salary),
    status: r.status,
    paymentDate: r.payment_date,
  };
}

export async function listPayslips(schoolId: string, month?: number, year?: number): Promise<Payslip[]> {
  let query = supabase
    .from('payslips')
    .select('*, teachers(full_name), staff(full_name)')
    .eq('school_id', schoolId);
  if (month) query = query.eq('period_month', month);
  if (year) query = query.eq('period_year', year);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPayslipRow);
}

export async function listMyPayslips(teacherId: string): Promise<Payslip[]> {
  const { data, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPayslipRow);
}

export async function generatePayslip(input: {
  schoolId: string;
  employee: Employee;
  periodMonth: number;
  periodYear: number;
  additionalDeduction?: number;
}): Promise<void> {
  const structure = await getSalaryStructure(input.employee);
  if (!structure) {
    throw new Error(`No salary structure set up for ${input.employee.fullName} yet.`);
  }

  const { error } = await supabase.from('payslips').insert({
    school_id: input.schoolId,
    ...employeeIdColumns(input.employee),
    period_month: input.periodMonth,
    period_year: input.periodYear,
    basic_salary: structure.basicSalary,
    allowances: structure.allowances,
    deductions: structure.deductions,
    additional_deduction: input.additionalDeduction ?? 0,
  });
  if (error) throw error;
}

export async function markPayslipPaid(id: string): Promise<void> {
  const { error } = await supabase
    .from('payslips')
    .update({ status: 'paid', payment_date: new Date().toISOString().slice(0, 10) })
    .eq('id', id);
  if (error) throw error;
}
