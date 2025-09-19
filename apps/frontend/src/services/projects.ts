import { api, ApiResponse } from '../lib/api';

export type Pagination<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type Session = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  sessionType: string;
  scheduledDate?: string | null;
  deliveryDate?: string | null;
  location?: string | null;
  description?: string | null;
  project?: {
    id: string;
    title: string;
  };
};

export type Project = {
  id: string;
  title: string;
  client: string;
  status: string;
  budget?: number | null;
  location?: string | null;
  scheduledAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: Session[];
};

export async function fetchProjects(params: { page?: number; pageSize?: number; search?: string; status?: string }) {
  const { data } = await api.get<ApiResponse<Pagination<Project>>>('/projects', { params });
  return data.data;
}

export async function createProject(payload: {
  title: string;
  client: string;
  status: string;
  budget?: number;
  location?: string;
  scheduledAt?: string;
  notes?: string;
}) {
  const { data } = await api.post<ApiResponse<Project>>('/projects', payload);
  return data.data;
}

export async function updateProject(id: string, payload: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'sessions'>>) {
  const { data } = await api.patch<ApiResponse<Project>>(`/projects/${id}`, payload);
  return data.data;
}

export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`);
}
