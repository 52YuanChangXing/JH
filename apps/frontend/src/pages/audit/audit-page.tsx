import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { fetchAuditLogs, AuditRecord } from '../../services/audit';
import { format } from 'date-fns';

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, search],
    queryFn: () => fetchAuditLogs({ page, pageSize: 8, action: search || undefined })
  });

  const columns: ColumnDef<AuditRecord>[] = [
    {
      header: '时间',
      accessorKey: 'createdAt',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MM-dd HH:mm')
    },
    {
      header: '操作',
      accessorKey: 'action'
    },
    {
      header: '实体',
      accessorKey: 'entity',
      cell: ({ row }) => `${row.original.entity}#${row.original.entityId}`
    },
    {
      header: '执行人',
      accessorKey: 'actor',
      cell: ({ row }) => row.original.actor?.displayName || '系统'
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">审计日志</CardTitle>
            <p className="text-sm text-slate-500">追踪后台每一次改动和关键事件</p>
          </div>
          <Input
            placeholder="搜索操作关键字"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="md:w-64"
          />
        </CardHeader>
        <CardContent>
          <DataTable<AuditRecord, unknown>
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={
              page: data?.pagination.page || 1,
              pageSize: data?.pagination.pageSize || 8,
              totalPages: data?.pagination.totalPages || 1,
              total: data?.pagination.total || 0,
              onChange: ({ pageIndex }) => setPage(pageIndex + 1)
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
