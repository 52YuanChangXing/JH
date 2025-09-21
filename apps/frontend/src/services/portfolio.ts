import { api, ApiResponse } from '../lib/api';
import { PortfolioItemRecord } from './public';

export async function fetchPortfolio(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const { data } = await api.get<
    ApiResponse<{ data: PortfolioItemRecord[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>
  >('/portfolio', { params });
  return data.data;
}

export async function createPortfolioItem(input: Partial<PortfolioItemRecord>) {
  const { data } = await api.post<ApiResponse<PortfolioItemRecord>>('/portfolio', input);
  return data.data;
}

export async function updatePortfolioItem(id: string, input: Partial<PortfolioItemRecord>) {
  const { data } = await api.patch<ApiResponse<PortfolioItemRecord>>(`/portfolio/${id}`, input);
  return data.data;
}

export async function deletePortfolioItem(id: string) {
  const { data } = await api.delete<ApiResponse<{ id: string }>>(`/portfolio/${id}`);
  return data.data;
}
