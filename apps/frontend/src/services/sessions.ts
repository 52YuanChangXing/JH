import { api, ApiResponse } from '../lib/api';
import { Pagination, Session } from './projects';

export async function fetchSessions(params: { page?: number; pageSize?: number; projectId?: string; status?: string }) {
  const { data } = await api.get<ApiResponse<Pagination<Session>>>('/sessions', { params });
  return data.data;
}

export async function createSession(payload: {
  projectId: string;
  title: string;
  sessionType: string;
  status: string;
  scheduledDate?: string;
  deliveryDate?: string;
  location?: string;
  description?: string;
}) {
  const { data } = await api.post<ApiResponse<Session>>('/sessions', payload);
  return data.data;
}

export async function updateSession(id: string, payload: Partial<Omit<Session, 'id'>>) {
  const { data } = await api.patch<ApiResponse<Session>>(`/sessions/${id}`, payload);
  return data.data;
}

export async function deleteSession(id: string) {
  await api.delete(`/sessions/${id}`);
}
