import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/data-table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { createProject, deleteProject, fetchProjects, Project, updateProject } from '../../services/projects';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '../../components/ui/sonner';
import { Select } from '../../components/projects/status-select';

const projectSchema = z.object({
  title: z.string().min(2),
  client: z.string().min(2),
  status: z.string().default('PLANNING'),
  budget: z.coerce.number().optional(),
  location: z.string().optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional()
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, statusFilter, search }],
    queryFn: () =>
      fetchProjects({
        page,
        pageSize: 5,
        status: statusFilter,
        search: search || undefined
      })
  });

  const form = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) });

  const resetForm = () => {
    form.reset({
      title: '',
      client: '',
      status: 'PLANNING',
      budget: undefined,
      location: '',
      scheduledAt: '',
      notes: ''
    });
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((project: Project) => {
    setEditingProject(project);
    form.reset({
      title: project.title,
      client: project.client,
      status: project.status,
      budget: project.budget ?? undefined,
      location: project.location ?? '',
      scheduledAt: project.scheduledAt ? project.scheduledAt.substring(0, 16) : '',
      notes: project.notes ?? ''
    });
    setDialogOpen(true);
  }, [form]);

  const mutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      if (editingProject) {
        return updateProject(editingProject.id, {
          ...values,
          scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined
        });
      }
      return createProject({
        ...values,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined
      });
    },
    onSuccess: () => {
      toast.success('项目保存成功');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
    },
    onError: () => toast.error('保存失败，请稍后再试')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      toast.success('项目已删除');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.error('删除失败')
  });

  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      header: '项目名称',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-800">{row.original.title}</p>
          <p className="text-xs text-slate-400">客户：{row.original.client}</p>
        </div>
      )
    },
    {
      header: '预算',
      accessorKey: 'budget',
      cell: ({ row }) => (row.original.budget ? `¥${row.original.budget.toLocaleString()}` : '未设定')
    },
    {
      header: '状态',
      accessorKey: 'status',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>
    },
    {
      header: '排期',
      accessorKey: 'scheduledAt',
      cell: ({ row }) =>
        row.original.scheduledAt ? format(new Date(row.original.scheduledAt), 'MM-dd HH:mm') : '待定'
    },
    {
      header: '操作',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEditDialog(row.original)}>
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
  ], [deleteMutation, openEditDialog]);

  const onSubmit = (values: ProjectFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">项目总览</CardTitle>
            <p className="text-sm text-slate-500">跟进所有摄影项目的进度与预算情况</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="搜索项目或客户"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="md:w-64"
            />
            <Select value={statusFilter} onChange={(value) => {
              setStatusFilter(value || undefined);
              setPage(1);
            }} />
            <Button onClick={openCreateDialog}>新增项目</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<Project, unknown>
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={{
              page: data?.pagination.page || 1,
              pageSize: data?.pagination.pageSize || 5,
              totalPages: data?.pagination.totalPages || 1,
              total: data?.pagination.total || 0,
              onChange: ({ pageIndex }) => {
                setPage(pageIndex + 1);
              }
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? '编辑项目' : '创建项目'}</DialogTitle>
            <DialogDescription>完善项目信息以便团队协作与资源调配</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">项目名称</Label>
                <Input id="title" {...form.register('title')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">客户名称</Label>
                <Input id="client" {...form.register('client')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Input id="status" placeholder="PLANNING" {...form.register('status')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">预算（元）</Label>
                <Input id="budget" type="number" step="0.01" {...form.register('budget')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">计划时间</Label>
                <Input id="scheduledAt" type="datetime-local" {...form.register('scheduledAt')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">地点</Label>
                <Input id="location" {...form.register('location')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea id="notes" rows={3} {...form.register('notes')} />
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
