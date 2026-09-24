import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseCategory } from '@/types/fees';

export async function listExpenseCategories(schoolId: string): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase.from('expense_categories').select('*').eq('school_id', schoolId).order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
}

export async function createExpenseCategory(schoolId: string, name: string): Promise<void> {
  const { error } = await supabase.from('expense_categories').insert({ school_id: schoolId, name });
  if (error) throw error;
}

export async function listExpenses(schoolId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_categories(name)')
    .eq('school_id', schoolId)
    .order('expense_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    expenseCategoryId: r.expense_category_id,
    categoryName: r.expense_categories?.name,
    description: r.description,
    amount: Number(r.amount),
    expenseDate: r.expense_date,
  }));
}

export async function createExpense(input: {
  schoolId: string;
  expenseCategoryId?: string | null;
  description: string;
  amount: number;
  expenseDate?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('expenses').insert({
    school_id: input.schoolId,
    expense_category_id: input.expenseCategoryId || null,
    description: input.description,
    amount: input.amount,
    expense_date: input.expenseDate || new Date().toISOString().slice(0, 10),
    created_by: user?.id ?? null,
  });
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function getTotalExpenses(schoolId: string, fromDate?: string, toDate?: string): Promise<number> {
  let query = supabase.from('expenses').select('amount').eq('school_id', schoolId);
  if (fromDate) query = query.gte('expense_date', fromDate);
  if (toDate) query = query.lte('expense_date', toDate);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
}
