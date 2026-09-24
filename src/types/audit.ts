export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userName?: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
}
