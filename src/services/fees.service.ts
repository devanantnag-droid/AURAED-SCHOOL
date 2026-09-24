import { supabase } from '@/lib/supabase';
import type { FeeCategory, FeeFrequency, FeeStructure, Payment, PaymentMethod, StudentFee } from '@/types/fees';

// ---------- Fee Categories ----------

export async function listFeeCategories(schoolId: string): Promise<FeeCategory[]> {
  const { data, error } = await supabase.from('fee_categories').select('*').eq('school_id', schoolId).order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description }));
}

export async function createFeeCategory(schoolId: string, name: string, description?: string): Promise<void> {
  const { error } = await supabase.from('fee_categories').insert({ school_id: schoolId, name, description: description || null });
  if (error) throw error;
}

// ---------- Fee Structures ----------

export async function listFeeStructures(schoolId: string): Promise<FeeStructure[]> {
  const { data, error } = await supabase
    .from('fee_structures')
    .select('*, fee_categories(name), classes(name)')
    .eq('school_id', schoolId);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    feeCategoryId: r.fee_category_id,
    classId: r.class_id,
    amount: Number(r.amount),
    frequency: r.frequency,
    categoryName: r.fee_categories?.name,
    className: r.classes?.name,
  }));
}

export async function createFeeStructure(input: {
  schoolId: string;
  sessionId: string;
  feeCategoryId: string;
  classId?: string | null;
  amount: number;
  frequency: FeeFrequency;
}): Promise<FeeStructure> {
  const { data, error } = await supabase
    .from('fee_structures')
    .insert({
      school_id: input.schoolId,
      academic_session_id: input.sessionId,
      fee_category_id: input.feeCategoryId,
      class_id: input.classId || null,
      amount: input.amount,
      frequency: input.frequency,
    })
    .select('*')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    feeCategoryId: data.fee_category_id,
    classId: data.class_id,
    amount: Number(data.amount),
    frequency: data.frequency as FeeFrequency,
  };
}

// Assigns a fee structure to every active student in its class (or every
// active student in the school, if the structure has no class_id) —
// creating one student_fees "invoice line" per student. Safe to re-run:
// the unique(student_id, fee_structure_id) constraint means students
// already assigned just get skipped.
export async function assignFeeToClass(input: {
  schoolId: string;
  sessionId: string;
  feeStructure: FeeStructure;
  dueDate?: string;
}): Promise<number> {
  let query = supabase.from('students').select('id').eq('school_id', input.schoolId).eq('status', 'active');
  if (input.feeStructure.classId) query = query.eq('class_id', input.feeStructure.classId);

  const { data: students, error } = await query;
  if (error) throw error;
  if (!students || students.length === 0) return 0;

  const { error: insertError, count } = await supabase
    .from('student_fees')
    .upsert(
      students.map((s) => ({
        school_id: input.schoolId,
        student_id: s.id,
        fee_structure_id: input.feeStructure.id,
        academic_session_id: input.sessionId,
        amount_due: input.feeStructure.amount,
        due_date: input.dueDate || null,
      })),
      { onConflict: 'student_id,fee_structure_id', ignoreDuplicates: true, count: 'exact' }
    );
  if (insertError) throw insertError;
  return count ?? students.length;
}

// ---------- Student Fees ----------

export async function listStudentFees(schoolId: string, studentId: string): Promise<StudentFee[]> {
  const { data, error } = await supabase
    .from('student_fees')
    .select('*, fee_structures(fee_categories(name))')
    .eq('school_id', schoolId)
    .eq('student_id', studentId);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    studentId: r.student_id,
    feeStructureId: r.fee_structure_id,
    categoryName: r.fee_structures?.fee_categories?.name,
    amountDue: Number(r.amount_due),
    discount: Number(r.discount),
    amountPaid: Number(r.amount_paid),
    dueDate: r.due_date,
    status: r.status,
  }));
}

export async function setFeeDiscount(studentFeeId: string, discount: number): Promise<void> {
  const { error } = await supabase.from('student_fees').update({ discount }).eq('id', studentFeeId);
  if (error) throw error;
}

// ---------- Payments ----------

export async function recordPayment(input: {
  schoolId: string;
  studentFeeId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
}): Promise<Payment> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('payments')
    .insert({
      school_id: input.schoolId,
      student_fee_id: input.studentFeeId,
      amount: input.amount,
      payment_method: input.paymentMethod,
      receipt_number: '',
      transaction_id: input.transactionId || null,
      notes: input.notes || null,
      received_by: user?.id ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  return {
    id: data.id,
    studentFeeId: data.student_fee_id,
    receiptNumber: data.receipt_number,
    amount: Number(data.amount),
    paymentMethod: data.payment_method as PaymentMethod,
    transactionId: data.transaction_id,
    paymentDate: data.payment_date,
    status: data.status as Payment['status'],
    notes: data.notes,
  };
}

export async function listPaymentsForStudentFee(studentFeeId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('student_fee_id', studentFeeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    studentFeeId: r.student_fee_id,
    receiptNumber: r.receipt_number,
    amount: Number(r.amount),
    paymentMethod: r.payment_method as PaymentMethod,
    transactionId: r.transaction_id,
    paymentDate: r.payment_date,
    status: r.status as Payment['status'],
    notes: r.notes,
  }));
}

export async function getTotalCollected(schoolId: string, fromDate?: string, toDate?: string): Promise<number> {
  let query = supabase.from('payments').select('amount').eq('school_id', schoolId).eq('status', 'success');
  if (fromDate) query = query.gte('payment_date', fromDate);
  if (toDate) query = query.lte('payment_date', toDate);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
}
