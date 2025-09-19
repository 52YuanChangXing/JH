import { api, ApiResponse } from '../lib/api';

export type OverviewResponse = {
  metrics: {
    projectCount: number;
    sessionCount: number;
    inProgressCount: number;
    deliveredCount: number;
    totalBudget: number;
    avgBudget: number;
  };
  recentAudit: Array<{
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
  }>;
  upcomingSessions: Array<{
    id: string;
    title: string;
    scheduledDate: string | null;
    project: { title: string };
    status: string;
  }>;
};

export async function fetchOverview() {
  const { data } = await api.get<ApiResponse<OverviewResponse>>('/stats/overview');
  return data.data;
}
