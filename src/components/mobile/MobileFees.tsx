import { Wallet } from 'lucide-react';
import type { StudentFee } from '@/types/fees';

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  pending: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export function MobileFees({ fees }: { fees: StudentFee[] }) {
  const totalDue = fees.reduce((sum, f) => sum + f.amountDue - f.discount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + f.amountPaid, 0);
  const totalPending = totalDue - totalPaid;

  return (
    <div className="p-4">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">Total</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-50">₹{totalDue}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">Paid</p>
          <p className="mt-0.5 text-sm font-semibold text-green-700 dark:text-green-400">₹{totalPaid}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="mt-0.5 text-sm font-semibold text-red-700 dark:text-red-400">₹{totalPending}</p>
        </div>
      </div>

      {fees.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
          <Wallet size={32} />
          <p className="text-sm">No fees have been assigned yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {fees.map((f) => (
            <li key={f.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{f.categoryName ?? 'Fee'}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[f.status] ?? ''}`}>{f.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                <span>Due: ₹{f.amountDue}</span>
                <span>Paid: ₹{f.amountPaid}</span>
                {f.discount > 0 && <span>Discount: ₹{f.discount}</span>}
                {f.dueDate && <span>Due date: {f.dueDate}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
