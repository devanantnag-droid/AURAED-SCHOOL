export interface InventoryCategory {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  categoryId: string | null;
  categoryName?: string;
  name: string;
  sku: string | null;
  unit: string | null;
  quantityInStock: number;
  reorderLevel: number;
  unitPrice: number | null;
}

export type TransactionType = 'purchase' | 'issue' | 'return' | 'adjustment';

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName?: string;
  transactionType: TransactionType;
  quantity: number;
  vendor: string | null;
  issuedTo: string | null;
  notes: string | null;
  createdAt: string;
}
