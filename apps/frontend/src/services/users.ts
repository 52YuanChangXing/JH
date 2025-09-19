import { api, ApiResponse } from '../lib/api';
import { Pagination } from './projects';

export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  createdAt: string;
};

export async function fetchUsers(params: { page?: number; pageSize?: number; search?: string }) {
  const { data } = await api.get<ApiResponse<Pagination<UserRecord>>>('/users', { params });
  return data.data;
}

export async function createUser(payload: {
  email: string;
  password: string;
  displayName: string;
  roles: string[];
}) {
  const { data } = await api.post<ApiResponse<UserRecord>>('/users', payload);
  return data.data;
}

export async function updateUser(id: string, payload: Partial<Omit<UserRecord, 'id' | 'createdAt'>>) {
  const { data } = await api.patch<ApiResponse<UserRecord>>(`/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}
