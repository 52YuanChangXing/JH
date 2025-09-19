import { api, ApiResponse } from '../lib/api';
import { Pagination } from './projects';

export type AuditRecord = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  actor?: {
    displayName: string;
    email: string;
  } | null;
};

export async function fetchAuditLogs(params: { page?: number; pageSize?: number; action?: string; actor?: string }) {
  const { data } = await api.get<ApiResponse<Pagination<AuditRecord>>>('/audit-logs', { params });
  return data.data;
}
