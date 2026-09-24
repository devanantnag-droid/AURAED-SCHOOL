export type EmployeeType = 'teacher' | 'staff';

export interface Employee {
  id: string;
  type: EmployeeType;
  fullName: string;
  employeeId: string;
}

export interface SalaryStructure {
  id: string;
  teacherId: string | null;
  staffId: string | null;
  basicSalary: number;
  allowances: number;
  deductions: number;
  effectiveFrom: string;
}

export type PayslipStatus = 'pending' | 'paid';

export interface Payslip {
  id: string;
  teacherId: string | null;
  staffId: string | null;
  employeeName?: string;
  periodMonth: number;
  periodYear: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  additionalDeduction: number;
  netSalary: number;
  status: PayslipStatus;
  paymentDate: string | null;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
