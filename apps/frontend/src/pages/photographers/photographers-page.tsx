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
import { PhotographerRecord } from '../../services/public';
import {
  createPhotographer,
  deletePhotographer,
  fetchPhotographers,
  updatePhotographer
} from '../../services/photographers';

const photographerSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  slug: z.string().min(1, '请输入唯一标识'),
  avatarUrl: z.string().url('请输入有效的头像地址').optional(),
  bio: z.string().min(10, '请填写个人介绍'),
  tagline: z.string().optional(),
  specialties: z.string().min(1, '请填写擅长领域'),
  experienceYears: z.coerce.number().min(0).max(60),
  accolades: z.string().optional(),
  socialLinks: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export function PhotographersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PhotographerRecord | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['photographers', page, search],
    queryFn: () => fetchPhotographers({ page, pageSize: 6, search: search || undefined })
  });

  const form = useForm<z.infer<typeof photographerSchema>>({
    resolver: zodResolver(photographerSchema),
    defaultValues: {
      name: '',
      slug: '',
      avatarUrl: '',
      bio: '',
      tagline: '',
      specialties: '',
      experienceYears: 0,
      accolades: '',
      socialLinks: '',
      isFeatured: false,
      isActive: true
    }
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: '',
      slug: '',
      avatarUrl: '',
      bio: '',
      tagline: '',
      specialties: '',
      experienceYears: 0,
      accolades: '',
      socialLinks: '',
      isFeatured: false,
      isActive: true
    });
    setDialogOpen(true);
  };

  const openEdit = (record: PhotographerRecord) => {
    setEditing(record);
    form.reset({
      name: record.name,
      slug: record.slug,
      avatarUrl: record.avatarUrl || '',
      bio: record.bio,
      tagline: record.tagline || '',
      specialties: record.specialties.join(', '),
      experienceYears: record.experienceYears,
      accolades: record.accolades.join(', '),
      socialLinks: record.socialLinks
        ? Object.entries(record.socialLinks)
            .map(([key, value]) => `${key}:${value}`)
            .join('\n')
        : '',
      isFeatured: record.isFeatured,
      isActive: record.isActive
    });
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof photographerSchema>) => {
      const payload: Partial<PhotographerRecord> = {
        name: values.name,
        slug: values.slug,
        avatarUrl: values.avatarUrl,
        bio: values.bio,
        tagline: values.tagline,
        specialties: values.specialties.split(',').map((item) => item.trim()).filter(Boolean),
        experienceYears: values.experienceYears,
        accolades: values.accolades
          ? values.accolades.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
        socialLinks: values.socialLinks
          ? Object.fromEntries(
              values.socialLinks
                .split('\n')
                .map((line) => line.split(':').map((item) => item.trim()))
                .filter((pair) => pair.length === 2)
            )
          : undefined,
        isFeatured: values.isFeatured,
        isActive: values.isActive
      };

      if (editing) {
        return updatePhotographer(editing.id, payload);
      }
      return createPhotographer(payload);
    },
    onSuccess: () => {
      toast.success('摄影师资料已保存');
      queryClient.invalidateQueries({ queryKey: ['photographers'] });
      setDialogOpen(false);
    },
    onError: () => toast.error('保存失败，请稍后再试')
  });

  const deleteMutation = useMutation({
    mutationFn: deletePhotographer,
    onSuccess: () => {
      toast.success('已删除摄影师档案');
      queryClient.invalidateQueries({ queryKey: ['photographers'] });
    },
    onError: () => toast.error('删除失败')
  });

  const columns = useMemo<ColumnDef<PhotographerRecord>[]>(
    () => [
      {
        header: '姓名',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.avatarUrl && (
              <img src={row.original.avatarUrl} alt={row.original.name} className="h-10 w-10 rounded-full object-cover" />
            )}
            <div>
              <p className="font-medium text-slate-900">{row.original.name}</p>
              <p className="text-xs text-slate-500">{row.original.tagline}</p>
            </div>
          </div>
        )
      },
      {
        header: '擅长领域',
        accessorKey: 'specialties',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.specialties.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        )
      },
      {
        header: '年资',
        accessorKey: 'experienceYears'
      },
      {
        header: '状态',
        accessorKey: 'isActive',
        cell: ({ row }) => (row.original.isActive ? <Badge>启用</Badge> : <Badge variant="outline">停用</Badge>)
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
            <CardTitle className="text-lg font-semibold">摄影师团队</CardTitle>
            <p className="text-sm text-slate-500">维护摄影师资料、特长及展示顺序。</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="搜索摄影师"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <Button onClick={openCreate}>新增摄影师</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<PhotographerRecord, unknown>
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
            <DialogTitle>{editing ? '编辑摄影师' : '新增摄影师'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input id="name" {...form.register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...form.register('slug')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">头像地址</Label>
              <Input id="avatarUrl" {...form.register('avatarUrl')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">一句话介绍</Label>
              <Input id="tagline" {...form.register('tagline')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">详细介绍</Label>
              <Textarea id="bio" rows={4} {...form.register('bio')} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="specialties">擅长领域（以逗号分隔）</Label>
                <Input id="specialties" {...form.register('specialties')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceYears">年资</Label>
                <Input id="experienceYears" type="number" {...form.register('experienceYears')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accolades">荣誉奖项（以逗号分隔）</Label>
              <Input id="accolades" {...form.register('accolades')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialLinks">社交链接（每行 key:value）</Label>
              <Textarea id="socialLinks" rows={3} {...form.register('socialLinks')} />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...form.register('isFeatured')} className="h-4 w-4" /> 首页推荐
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
