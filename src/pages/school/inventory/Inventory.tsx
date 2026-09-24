import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import {
  createCategory,
  createItem,
  listCategories,
  listItems,
  listTransactions,
  recordTransaction,
} from '@/services/inventory.service';
import type { InventoryCategory, InventoryItem, InventoryTransaction, TransactionType } from '@/types/inventory';
import { PageHeader } from '@/components/shared/PageHeader';

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'purchase', label: 'Purchase (add stock)' },
  { value: 'issue', label: 'Issue (remove stock)' },
  { value: 'return', label: 'Return (add stock)' },
  { value: 'adjustment', label: 'Adjustment (add stock)' },
];

function InventoryInner() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'items' | 'transactions'>('items');
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [reorderLevel, setReorderLevel] = useState('0');
  const [unitPrice, setUnitPrice] = useState('');

  const [txItemId, setTxItemId] = useState('');
  const [txType, setTxType] = useState<TransactionType>('purchase');
  const [txQuantity, setTxQuantity] = useState('');
  const [txVendor, setTxVendor] = useState('');
  const [txIssuedTo, setTxIssuedTo] = useState('');
  const [txNotes, setTxNotes] = useState('');

  async function loadAll() {
    if (!profile?.schoolId) return;
    const [c, i, t] = await Promise.all([
      listCategories(profile.schoolId),
      listItems(profile.schoolId),
      listTransactions(profile.schoolId),
    ]);
    setCategories(c);
    setItems(i);
    setTransactions(t);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleAddCategory() {
    if (!profile?.schoolId || !categoryName.trim()) return;
    setErrorMsg(null);
    try {
      await createCategory(profile.schoolId, categoryName);
      setCategoryName('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add category.'));
    }
  }

  async function handleAddItem() {
    if (!profile?.schoolId || !itemName.trim()) return;
    setErrorMsg(null);
    try {
      await createItem({
        schoolId: profile.schoolId,
        categoryId: itemCategoryId || null,
        name: itemName,
        sku: itemSku,
        unit: itemUnit,
        reorderLevel: Number(reorderLevel) || 0,
        unitPrice: unitPrice ? Number(unitPrice) : undefined,
      });
      setItemName('');
      setItemSku('');
      setItemUnit('');
      setReorderLevel('0');
      setUnitPrice('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add item.'));
    }
  }

  async function handleRecordTransaction() {
    if (!profile?.schoolId || !txItemId || !txQuantity) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await recordTransaction({
        schoolId: profile.schoolId,
        itemId: txItemId,
        transactionType: txType,
        quantity: Number(txQuantity),
        vendor: txVendor,
        issuedTo: txIssuedTo,
        notes: txNotes,
      });
      setSuccessMsg('Transaction recorded.');
      setTxQuantity('');
      setTxVendor('');
      setTxIssuedTo('');
      setTxNotes('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to record transaction.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Inventory" />
      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['items', 'transactions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 capitalize ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      {successMsg && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{successMsg}</p>}

      {tab === 'items' ? (
        <div>
          <PermissionGate code="inventory.manage">
            <div className="mb-5 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Add item</h2>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <input className="input" placeholder="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                <select className="input" value={itemCategoryId} onChange={(e) => setItemCategoryId(e.target.value)}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className="input" placeholder="SKU (optional)" value={itemSku} onChange={(e) => setItemSku(e.target.value)} />
                <input className="input" placeholder="Unit (e.g. pcs, box)" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} />
                <input type="number" className="input" placeholder="Reorder level" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
                <input type="number" className="input" placeholder="Unit price (optional)" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
              </div>
              <button onClick={handleAddItem} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Add item
              </button>

              <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                <input className="input max-w-xs" placeholder="New category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
                <button onClick={handleAddCategory} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                  Add category
                </button>
              </div>
            </div>
          </PermissionGate>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No inventory items yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              {items.map((i) => {
                const isLow = i.quantityInStock <= i.reorderLevel;
                return (
                  <li key={i.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-50">{i.name}</span>
                      {i.categoryName && <span className="ml-2 text-xs text-gray-500">{i.categoryName}</span>}
                    </div>
                    <span className={`flex items-center gap-1 text-xs ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}>
                      {isLow && <AlertTriangle size={12} />}
                      {i.quantityInStock} {i.unit ?? ''} in stock {isLow && '(low)'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <PermissionGate code="inventory.manage">
            <div className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Record transaction</h2>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <select className="input" value={txItemId} onChange={(e) => setTxItemId(e.target.value)}>
                  <option value="">Item…</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <select className="input" value={txType} onChange={(e) => setTxType(e.target.value as TransactionType)}>
                  {TRANSACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input type="number" className="input" placeholder="Quantity" value={txQuantity} onChange={(e) => setTxQuantity(e.target.value)} />
                {txType === 'purchase' && (
                  <input className="input" placeholder="Vendor" value={txVendor} onChange={(e) => setTxVendor(e.target.value)} />
                )}
                {txType === 'issue' && (
                  <input className="input" placeholder="Issued to" value={txIssuedTo} onChange={(e) => setTxIssuedTo(e.target.value)} />
                )}
                <input className="input" placeholder="Notes (optional)" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} />
              </div>
              <button onClick={handleRecordTransaction} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Record transaction
              </button>
            </div>
          </PermissionGate>

          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Recent transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-3 py-2">
                  <span>
                    {t.itemName} · <span className="capitalize">{t.transactionType}</span> · {t.quantity}
                  </span>
                  <span className="text-xs text-gray-500">
                    {t.vendor ?? t.issuedTo ?? ''} {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function InventoryPage() {
  return (
    <FeatureGate feature="inventory">
      <InventoryInner />
    </FeatureGate>
  );
}
