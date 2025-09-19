import { api, ApiResponse } from '../lib/api';

export type RoleRecord = {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
};

export type RoleListResponse = {
  roles: RoleRecord[];
  permissions: Array<{ id: string; name: string; description?: string | null }>;
};

export async function fetchRoles() {
  const { data } = await api.get<ApiResponse<RoleListResponse>>('/roles');
  return data.data;
}

export async function createRole(payload: { name: string; description?: string; permissions: string[] }) {
  const { data } = await api.post<ApiResponse<RoleRecord>>('/roles', payload);
  return data.data;
}

export async function updateRole(id: string, payload: Partial<Omit<RoleRecord, 'id'>>) {
  const { data } = await api.patch<ApiResponse<RoleRecord>>(`/roles/${id}`, payload);
  return data.data;
}

export async function deleteRole(id: string) {
  await api.delete(`/roles/${id}`);
}
