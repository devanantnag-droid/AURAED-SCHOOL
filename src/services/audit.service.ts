import { supabase } from '@/lib/supabase';
import type { AuditAction, AuditLogEntry } from '@/types/audit';

export async function listAuditLogs(
  schoolId: string,
  filters: { entityType?: string; fromDate?: string; toDate?: string },
  limit: number,
  offset: number
): Promise<{ rows: AuditLogEntry[]; hasMore: boolean }> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.entityType) query = query.ilike('entity_type', `%${filters.entityType}%`);
  if (filters.fromDate) query = query.gte('created_at', filters.fromDate);
  if (filters.toDate) query = query.lte('created_at', `${filters.toDate}T23:59:59`);

  const { data, error } = await query;
  if (error) throw error;

  const logRows = data ?? [];

  // audit_logs.user_id references auth.users, not public.profiles directly —
  // there's no foreign key PostgREST can use for an automatic nested join,
  // even though profiles.id matches the same values. Look names up
  // separately instead.
  const userIds = [...new Set(logRows.map((r) => r.user_id).filter((id): id is string => !!id))];
  let namesById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
    namesById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  }

  const rows: AuditLogEntry[] = logRows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_id ? namesById.get(r.user_id) : undefined,
    action: r.action as AuditAction,
    entityType: r.entity_type,
    entityId: r.entity_id,
    oldData: r.old_data as Record<string, unknown> | null,
    newData: r.new_data as Record<string, unknown> | null,
    createdAt: r.created_at,
  }));

  return { rows, hasMore: rows.length === limit };
}
