import { api, ApiResponse } from '../lib/api';
import { PhotographerRecord } from './public';

export async function fetchPhotographers(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const { data } = await api.get<
    ApiResponse<{ data: PhotographerRecord[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>
  >('/photographers', { params });
  return data.data;
}

export async function createPhotographer(input: Partial<PhotographerRecord>) {
  const { data } = await api.post<ApiResponse<PhotographerRecord>>('/photographers', input);
  return data.data;
}

export async function updatePhotographer(id: string, input: Partial<PhotographerRecord>) {
  const { data } = await api.patch<ApiResponse<PhotographerRecord>>(`/photographers/${id}`, input);
  return data.data;
}

export async function deletePhotographer(id: string) {
  const { data } = await api.delete<ApiResponse<{ id: string }>>(`/photographers/${id}`);
  return data.data;
}
