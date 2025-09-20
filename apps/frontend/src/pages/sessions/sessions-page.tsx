import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/data-table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { createSession, deleteSession, fetchSessions, Session, updateSession } from '../../services/sessions';
import { fetchProjects } from '../../services/projects';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '../../components/ui/sonner';
import { format } from 'date-fns';

const sessionSchema = z.object({
  projectId: z.string().min(1, '请选择所属项目'),
  title: z.string().min(2),
  sessionType: z.string(),
  status: z.string(),
  scheduledDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional()
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export function SessionsPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', page],
    queryFn: () => fetchSessions({ page, pageSize: 6 })
  });

  const projectQuery = useQuery({
    queryKey: ['projectOptions'],
    queryFn: () => fetchProjects({ page: 1, pageSize: 100 })
  });

  const form = useForm<SessionFormValues>({ resolver: zodResolver(sessionSchema) });

  const mutation = useMutation({
    mutationFn: async (values: SessionFormValues) => {
      if (editingSession) {
        return updateSession(editingSession.id, {
          ...values,
          scheduledDate: values.scheduledDate ? new Date(values.scheduledDate).toISOString() : undefined,
          deliveryDate: values.deliveryDate ? new Date(values.deliveryDate).toISOString() : undefined
        });
      }
      return createSession({
        ...values,
        scheduledDate: values.scheduledDate ? new Date(values.scheduledDate).toISOString() : undefined,
        deliveryDate: values.deliveryDate ? new Date(values.deliveryDate).toISOString() : undefined
      });
    },
    onSuccess: () => {
      toast.success('会话已保存');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setDialogOpen(false);
    },
    onError: () => toast.error('保存失败')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      toast.success('会话已删除');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: () => toast.error('删除失败')
  });
  const handleEdit = (session: Session) => {
    setEditingSession(session);
    form.reset({
      projectId: session.projectId,
      title: session.title,
      sessionType: session.sessionType,
      status: session.status,
      scheduledDate: session.scheduledDate ? session.scheduledDate.substring(0, 16) : '',
      deliveryDate: session.deliveryDate ? session.deliveryDate.substring(0, 16) : '',
      location: session.location ?? '',
      description: session.description ?? ''
    });
    setDialogOpen(true);
  };

  const columns: ColumnDef<Session>[] = [
    {
      header: '会话名称',
      accessorKey: 'title'
    },
    {
      header: '类型',
      accessorKey: 'sessionType'
    },
    {
      header: '状态',
      accessorKey: 'status',
      cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>
    },
    {
      header: '计划时间',
      accessorKey: 'scheduledDate',
      cell: ({ row }) =>
        row.original.scheduledDate ? format(new Date(row.original.scheduledDate), 'MM-dd HH:mm') : '待定'
    },
    {
      header: '操作',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(row.original)}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteMutation.mutate(row.original.id)}
            disabled={deleteMutation.isLoading}
          >
            删除
          </Button>
        </div>
      )
    }
  ];


  const openCreate = () => {
    setEditingSession(null);
    form.reset({
      projectId: '',
      title: '',
      sessionType: 'WEDDING',
      status: 'SCHEDULED',
      scheduledDate: '',
      deliveryDate: '',
      location: '',
      description: ''
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: SessionFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">拍摄排期</CardTitle>
            <p className="text-sm text-slate-500">统筹婚礼、商业、旅拍等不同拍摄任务</p>
          </div>
          <Button onClick={openCreate}>安排新拍摄</Button>
        </CardHeader>
        <CardContent>
          <DataTable<Session, unknown>
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={
              page: data?.pagination.page || 1,
              pageSize: data?.pagination.pageSize || 6,
              totalPages: data?.pagination.totalPages || 1,
              total: data?.pagination.total || 0,
              onChange: ({ pageIndex }) => setPage(pageIndex + 1)
            }
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSession ? '编辑拍摄会话' : '新增拍摄会话'}</DialogTitle>
            <DialogDescription>补充关键信息以提醒团队与客户。</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="projectId">所属项目</Label>
              <select
                id="projectId"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                {...form.register('projectId')}
              >
                <option value="">请选择项目</option>
                {projectQuery.data?.data.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">会话主题</Label>
                <Input id="title" {...form.register('title')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionType">类型</Label>
                <Input id="sessionType" {...form.register('sessionType')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Input id="status" {...form.register('status')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">地点</Label>
                <Input id="location" {...form.register('location')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">计划时间</Label>
                <Input id="scheduledDate" type="datetime-local" {...form.register('scheduledDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">交付时间</Label>
                <Input id="deliveryDate" type="datetime-local" {...form.register('deliveryDate')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea id="description" rows={3} {...form.register('description')} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={mutation.isLoading}>
                {mutation.isLoading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
