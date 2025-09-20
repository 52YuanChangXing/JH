import { useQuery } from '@tanstack/react-query';
import { fetchOverview } from '../../services/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const metricLabels: Record<string, { label: string; suffix?: string }> = {
  projectCount: { label: '在管项目' },
  sessionCount: { label: '拍摄排期' },
  inProgressCount: { label: '进行中项目' },
  deliveredCount: { label: '本月交付' },
  totalBudget: { label: '项目总预算', suffix: '¥' },
  avgBudget: { label: '平均预算', suffix: '¥' }
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview });

  if (isLoading || !data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const metricsEntries = Object.entries(data.metrics);

  const revenueTrend = data.upcomingSessions.map((session) => ({
    name: session.title,
    value: session.status === 'DELIVERED' ? 100 : session.status === 'EDITING' ? 70 : 40
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricsEntries.map(([key, value]) => (
          <Card key={key} className="border-none bg-white/80 shadow-md backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {metricLabels[key]?.label || key}
              </CardTitle>
              <Badge variant="secondary">实时</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900">
                {metricLabels[key]?.suffix ? `${metricLabels[key]?.suffix}${value.toLocaleString()}` : value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="border-none bg-white/90 shadow-md backdrop-blur lg:col-span-4">
          <CardHeader>
            <CardTitle>项目活跃度</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4c66ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4c66ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                <YAxis stroke="#475569" tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#4c66ff" fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-none bg-white/90 shadow-md backdrop-blur lg:col-span-3">
          <CardHeader>
            <CardTitle>近期审计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentAudit.map((log) => (
              <div key={log.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{log.action}</span>
                  <span className="text-xs text-slate-400">{format(new Date(log.createdAt), 'MM-dd HH:mm')}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {log.actor?.displayName || '系统'} · {log.entity} · {log.entityId}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-white/90 shadow-md backdrop-blur">
        <CardHeader>
          <CardTitle>未来拍摄日程</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.upcomingSessions.map((session) => ({
              name: session.project.title,
              value: session.scheduledDate ? new Date(session.scheduledDate).getTime() : Date.now()
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#475569" tickLine={false} />
              <YAxis
                dataKey="value"
                stroke="#475569"
                tickFormatter={(value) => format(new Date(value), 'MM-dd')}
                tickLine={false}
              />
              <Tooltip labelFormatter={(name) => name as string} formatter={(value) => format(new Date(value as number), 'MM-dd HH:mm')} />
              <Line type="monotone" dataKey="value" stroke="#4c66ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
