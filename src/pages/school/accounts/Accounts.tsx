import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  getTotalExpenses,
  listExpenseCategories,
  listExpenses,
} from '@/services/accounts.service';
import { getTotalCollected } from '@/services/fees.service';
import type { Expense, ExpenseCategory } from '@/types/fees';
import { PageHeader } from '@/components/shared/PageHeader';

function AccountsInner() {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [expCategoryId, setExpCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));

  async function loadAll() {
    if (!profile?.schoolId) return;
    const [cats, exps, income, expenseTotal] = await Promise.all([
      listExpenseCategories(profile.schoolId),
      listExpenses(profile.schoolId),
      getTotalCollected(profile.schoolId),
      getTotalExpenses(profile.schoolId),
    ]);
    setCategories(cats);
    setExpenses(exps);
    setTotalIncome(income);
    setTotalExpenses(expenseTotal);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleAddCategory() {
    if (!profile?.schoolId || !categoryName.trim()) return;
    setErrorMsg(null);
    try {
      await createExpenseCategory(profile.schoolId, categoryName);
      setCategoryName('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add category.'));
    }
  }

  async function handleAddExpense() {
    if (!profile?.schoolId || !description.trim() || !amount) return;
    setErrorMsg(null);
    try {
      await createExpense({
        schoolId: profile.schoolId,
        expenseCategoryId: expCategoryId || null,
        description,
        amount: Number(amount),
        expenseDate,
      });
      setDescription('');
      setAmount('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add expense.'));
    }
  }

  async function handleDelete(id: string) {
    setErrorMsg(null);
    try {
      await deleteExpense(id);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to delete expense.'));
    }
  }

  const net = totalIncome - totalExpenses;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Accounts" />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500">Total income (fees)</p>
          <p className="mt-1 text-xl font-semibold text-green-700 dark:text-green-400">₹{totalIncome.toFixed(2)}</p>
        </div>
        <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500">Total expenses</p>
          <p className="mt-1 text-xl font-semibold text-red-600">₹{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500">Net</p>
          <p className={`mt-1 text-xl font-semibold ${net >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
            ₹{net.toFixed(2)}
          </p>
        </div>
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <PermissionGate code="accounts.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Record expense</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <select className="input" value={expCategoryId} onChange={(e) => setExpCategoryId(e.target.value)}>
              <option value="">Category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" className="input" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            <input type="number" className="input max-w-[140px]" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <button onClick={handleAddExpense} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Add expense
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
            <input className="input max-w-xs" placeholder="New expense category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
            <button onClick={handleAddCategory} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              Add category
            </button>
          </div>
        </section>
      </PermissionGate>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Expenses</h2>
        {expenses.length === 0 ? (
          <p className="text-sm text-gray-500">No expenses recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-50">{e.description}</span>
                  <span className="ml-2 text-xs text-gray-500">{e.categoryName ?? 'Uncategorized'} · {e.expenseDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-red-600">₹{e.amount.toFixed(2)}</span>
                  <PermissionGate code="accounts.manage">
                    <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:underline">
                      <Trash2 size={14} />
                    </button>
                  </PermissionGate>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AccountsPage() {
  return (
    <FeatureGate feature="accounts">
      <AccountsInner />
    </FeatureGate>
  );
}
