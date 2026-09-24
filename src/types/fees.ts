export interface FeeCategory {
  id: string;
  name: string;
  description: string | null;
}

export type FeeFrequency = 'one_time' | 'monthly' | 'quarterly' | 'annual';

export interface FeeStructure {
  id: string;
  feeCategoryId: string;
  classId: string | null;
  amount: number;
  frequency: FeeFrequency;
  categoryName?: string;
  className?: string;
}

export type StudentFeeStatus = 'pending' | 'partial' | 'paid';

export interface StudentFee {
  id: string;
  studentId: string;
  studentName?: string;
  feeStructureId: string;
  categoryName?: string;
  amountDue: number;
  discount: number;
  amountPaid: number;
  dueDate: string | null;
  status: StudentFeeStatus;
}

export type PaymentMethod = 'cash' | 'cheque' | 'card' | 'online' | 'upi' | 'bank_transfer';

export interface Payment {
  id: string;
  studentFeeId: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  paymentDate: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  notes: string | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  expenseCategoryId: string | null;
  categoryName?: string;
  description: string;
  amount: number;
  expenseDate: string;
}
