import { api, ApiResponse } from '../lib/api';
import { ServiceRecord } from './public';

export async function fetchStudioServices(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const { data } = await api.get<
    ApiResponse<{ data: ServiceRecord[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>
  >('/services', { params });
  return data.data;
}

export async function createStudioService(input: Partial<ServiceRecord>) {
  const { data } = await api.post<ApiResponse<ServiceRecord>>('/services', input);
  return data.data;
}

export async function updateStudioService(id: string, input: Partial<ServiceRecord>) {
  const { data } = await api.patch<ApiResponse<ServiceRecord>>(`/services/${id}`, input);
  return data.data;
}

export async function deleteStudioService(id: string) {
  const { data } = await api.delete<ApiResponse<{ id: string }>>(`/services/${id}`);
  return data.data;
}
