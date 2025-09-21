import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DataTable } from '../../components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/sonner';
import { ServiceRecord } from '../../services/public';
import {
  createStudioService,
  deleteStudioService,
  fetchStudioServices,
  updateStudioService
} from '../../services/studio-services';

const serviceSchema = z.object({
  name: z.string().min(1, '请输入服务名称'),
  slug: z.string().min(1, '请输入唯一标识'),
  summary: z.string().min(1, '请输入服务简介'),
  description: z.string().min(1, '请输入服务详情'),
  priceFrom: z.coerce.number().min(0),
  duration: z.coerce.number().min(1),
  deliverables: z.string().min(1, '请输入交付内容'),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export function ServicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['studio-services', page, search],
    queryFn: () => fetchStudioServices({ page, pageSize: 6, search: search || undefined })
  });

  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      slug: '',
      summary: '',
      description: '',
      priceFrom: 0,
      duration: 1,
      deliverables: '',
      isPopular: false,
      isActive: true
    }
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: '',
      slug: '',
      summary: '',
      description: '',
      priceFrom: 0,
      duration: 1,
      deliverables: '',
      isPopular: false,
      isActive: true
    });
    setDialogOpen(true);
  };

  const openEdit = (record: ServiceRecord) => {
    setEditing(record);
    form.reset({
      name: record.name,
      slug: record.slug,
      summary: record.summary,
      description: record.description,
      priceFrom: record.priceFrom,
      duration: record.duration,
      deliverables: record.deliverables.join('\n'),
      isPopular: record.isPopular,
      isActive: true
    });
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof serviceSchema>) => {
      const payload: Partial<ServiceRecord> = {
        name: values.name,
        slug: values.slug,
        summary: values.summary,
        description: values.description,
        priceFrom: values.priceFrom,
        duration: values.duration,
        deliverables: values.deliverables.split('\n').map((item) => item.trim()).filter(Boolean),
        isPopular: values.isPopular,
        isActive: values.isActive
      };
      if (editing) {
        return updateStudioService(editing.id, payload);
      }
      return createStudioService(payload);
    },
    onSuccess: () => {
      toast.success('服务信息已保存');
      queryClient.invalidateQueries({ queryKey: ['studio-services'] });
      setDialogOpen(false);
    },
    onError: () => toast.error('保存失败，请稍后再试')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudioService,
    onSuccess: () => {
      toast.success('服务已删除');
      queryClient.invalidateQueries({ queryKey: ['studio-services'] });
    },
    onError: () => toast.error('删除失败')
  });

  const columns = useMemo<ColumnDef<ServiceRecord>[]>(
    () => [
      {
        header: '服务',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            <p className="text-xs text-slate-500">{row.original.summary}</p>
          </div>
        )
      },
      {
        header: '价格',
        accessorKey: 'priceFrom',
        cell: ({ row }) => `¥${row.original.priceFrom.toLocaleString()}`
      },
      {
        header: '时长',
        accessorKey: 'duration',
        cell: ({ row }) => `${row.original.duration} 小时`
      },
      {
        header: '热门',
        accessorKey: 'isPopular',
        cell: ({ row }) => (row.original.isPopular ? <Badge>推荐</Badge> : <Badge variant="outline">常规</Badge>)
      },
      {
        header: '操作',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>
              编辑
            </Button>
            <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(row.original.id)}>
              删除
            </Button>
          </div>
        )
      }
    ],
    [deleteMutation]
  );

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">服务套餐</CardTitle>
            <p className="text-sm text-slate-500">管理婚礼、商业、旅拍等核心服务内容与交付。</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="搜索服务"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <Button onClick={openCreate}>新增服务</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<ServiceRecord, unknown>
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={{
              page: data?.pagination.page || 1,
              pageSize: data?.pagination.pageSize || 6,
              totalPages: data?.pagination.totalPages || 1,
              total: data?.pagination.total || 0,
              onChange: ({ pageIndex }) => setPage(pageIndex + 1)
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑服务' : '新增服务'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">服务名称</Label>
                <Input id="name" {...form.register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...form.register('slug')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">服务摘要</Label>
              <Textarea id="summary" rows={2} {...form.register('summary')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">服务详情</Label>
              <Textarea id="description" rows={4} {...form.register('description')} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priceFrom">起步价 (¥)</Label>
                <Input id="priceFrom" type="number" {...form.register('priceFrom')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">预计时长（小时）</Label>
                <Input id="duration" type="number" {...form.register('duration')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverables">交付清单（每行一项）</Label>
              <Textarea id="deliverables" rows={4} {...form.register('deliverables')} />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...form.register('isPopular')} className="h-4 w-4" /> 热门推荐
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...form.register('isActive')} className="h-4 w-4" defaultChecked /> 启用
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
