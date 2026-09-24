import { supabase } from '@/lib/supabase';
import type { InventoryCategory, InventoryItem, InventoryTransaction, TransactionType } from '@/types/inventory';

export async function listCategories(schoolId: string): Promise<InventoryCategory[]> {
  const { data, error } = await supabase.from('inventory_categories').select('*').eq('school_id', schoolId).order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
}

export async function createCategory(schoolId: string, name: string): Promise<void> {
  const { error } = await supabase.from('inventory_categories').insert({ school_id: schoolId, name });
  if (error) throw error;
}

export async function listItems(schoolId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, inventory_categories(name)')
    .eq('school_id', schoolId)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    categoryId: r.category_id,
    categoryName: r.inventory_categories?.name,
    name: r.name,
    sku: r.sku,
    unit: r.unit,
    quantityInStock: r.quantity_in_stock,
    reorderLevel: r.reorder_level,
    unitPrice: r.unit_price !== null ? Number(r.unit_price) : null,
  }));
}

export async function createItem(input: {
  schoolId: string;
  categoryId?: string | null;
  name: string;
  sku?: string;
  unit?: string;
  reorderLevel: number;
  unitPrice?: number;
}): Promise<void> {
  const { error } = await supabase.from('inventory_items').insert({
    school_id: input.schoolId,
    category_id: input.categoryId || null,
    name: input.name,
    sku: input.sku || null,
    unit: input.unit || null,
    reorder_level: input.reorderLevel,
    unit_price: input.unitPrice ?? null,
  });
  if (error) throw error;
}

export async function listTransactions(schoolId: string): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*, inventory_items(name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    itemId: r.item_id,
    itemName: r.inventory_items?.name,
    transactionType: r.transaction_type,
    quantity: r.quantity,
    vendor: r.vendor,
    issuedTo: r.issued_to,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export async function recordTransaction(input: {
  schoolId: string;
  itemId: string;
  transactionType: TransactionType;
  quantity: number;
  vendor?: string;
  issuedTo?: string;
  notes?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('inventory_transactions').insert({
    school_id: input.schoolId,
    item_id: input.itemId,
    transaction_type: input.transactionType,
    quantity: input.quantity,
    vendor: input.vendor || null,
    issued_to: input.issuedTo || null,
    notes: input.notes || null,
    created_by: user?.id ?? null,
  });
  if (error) throw error;
}
