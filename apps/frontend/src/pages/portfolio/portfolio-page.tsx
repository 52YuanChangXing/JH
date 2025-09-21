import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DataTable } from '../../components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/sonner';
import { PortfolioItemRecord } from '../../services/public';
import {
  createPortfolioItem,
  deletePortfolioItem,
  fetchPortfolio,
  updatePortfolioItem
} from '../../services/portfolio';
import { fetchPhotographers } from '../../services/photographers';

const portfolioSchema = z.object({
  title: z.string().min(1, '请输入标题'),
  slug: z.string().min(1, '请输入 slug'),
  coverImageUrl: z.string().url('请输入有效的封面地址'),
  galleryImages: z.string().min(1, '请输入图库地址'),
  description: z.string().optional(),
  location: z.string().optional(),
  shotDate: z.string().optional(),
  categories: z.string().min(1, '请输入分类'),
  featured: z.boolean().optional(),
  photographerId: z.string().optional()
});

export function PortfolioPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioItemRecord | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', page, search],
    queryFn: () => fetchPortfolio({ page, pageSize: 8, search: search || undefined })
  });

  const photographersQuery = useQuery({ queryKey: ['photographers', 'for-portfolio'], queryFn: () => fetchPhotographers({ pageSize: 50 }) });

  const form = useForm<z.infer<typeof portfolioSchema>>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      title: '',
      slug: '',
      coverImageUrl: '',
      galleryImages: '',
      description: '',
      location: '',
      shotDate: '',
      categories: '',
      featured: false,
      photographerId: ''
    }
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      title: '',
      slug: '',
      coverImageUrl: '',
      galleryImages: '',
      description: '',
      location: '',
      shotDate: '',
      categories: '',
      featured: false,
      photographerId: ''
    });
    setDialogOpen(true);
  };

  const openEdit = (record: PortfolioItemRecord) => {
    setEditing(record);
    form.reset({
      title: record.title,
      slug: record.slug,
      coverImageUrl: record.coverImageUrl,
      galleryImages: record.galleryImages.join('\n'),
      description: record.description || '',
      location: record.location || '',
      shotDate: record.shotDate ? record.shotDate.slice(0, 10) : '',
      categories: record.categories.join(', '),
      featured: record.featured,
      photographerId: record.photographer?.id || ''
    });
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof portfolioSchema>) => {
      const galleryImages = values.galleryImages.split('\n').map((item) => item.trim()).filter(Boolean);
      const categories = values.categories.split(',').map((item) => item.trim()).filter(Boolean);

      if (editing) {
        return updatePortfolioItem(editing.id, {
          title: values.title,
          slug: values.slug,
          coverImageUrl: values.coverImageUrl,
          galleryImages,
          description: values.description,
          location: values.location,
          shotDate: values.shotDate,
          categories,
          featured: values.featured,
          photographerId: values.photographerId || null
        });
      }
      return createPortfolioItem({
        title: values.title,
        slug: values.slug,
        coverImageUrl: values.coverImageUrl,
        galleryImages,
        description: values.description,
        location: values.location,
        shotDate: values.shotDate,
        categories,
        featured: values.featured,
        photographerId: values.photographerId || undefined
      });
    },
    onSuccess: () => {
      toast.success('作品内容已保存');
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setDialogOpen(false);
    },
    onError: () => toast.error('保存失败，请稍后再试')
  });

  const deleteMutation = useMutation({
    mutationFn: deletePortfolioItem,
    onSuccess: () => {
      toast.success('作品已删除');
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: () => toast.error('删除失败')
  });

  const columns = useMemo<ColumnDef<PortfolioItemRecord>[]>(
    () => [
      {
        header: '作品',
        accessorKey: 'title',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <img src={row.original.coverImageUrl} alt={row.original.title} className="h-12 w-20 rounded-lg object-cover" />
            <div>
              <p className="font-medium text-slate-900">{row.original.title}</p>
              <p className="text-xs text-slate-500">{row.original.location}</p>
            </div>
          </div>
        )
      },
      {
        header: '摄影师',
        accessorKey: 'photographer',
        cell: ({ row }) => row.original.photographer?.name || '未关联'
      },
      {
        header: '拍摄日期',
        accessorKey: 'shotDate',
        cell: ({ row }) => (row.original.shotDate ? format(new Date(row.original.shotDate), 'yyyy-MM-dd') : '—')
      },
      {
        header: '标签',
        accessorKey: 'categories',
        cell: ({ row }) => row.original.categories.join('、')
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
            <CardTitle className="text-lg font-semibold">作品集</CardTitle>
            <p className="text-sm text-slate-500">管理官网展示的精选案例与图集内容。</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="搜索作品标题或地点"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <Button onClick={openCreate}>新增作品</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<PortfolioItemRecord, unknown>
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={{
              page: data?.pagination.page || 1,
              pageSize: data?.pagination.pageSize || 8,
              totalPages: data?.pagination.totalPages || 1,
              total: data?.pagination.total || 0,
              onChange: ({ pageIndex }) => setPage(pageIndex + 1)
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑作品' : '新增作品'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input id="title" {...form.register('title')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...form.register('slug')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">封面地址</Label>
              <Input id="coverImageUrl" {...form.register('coverImageUrl')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="galleryImages">图库地址（每行一张）</Label>
              <Textarea id="galleryImages" rows={3} {...form.register('galleryImages')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">作品描述</Label>
              <Textarea id="description" rows={3} {...form.register('description')} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="location">拍摄地点</Label>
                <Input id="location" {...form.register('location')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shotDate">拍摄日期</Label>
                <Input id="shotDate" type="date" {...form.register('shotDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categories">分类（以逗号分隔）</Label>
                <Input id="categories" {...form.register('categories')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>关联摄影师</Label>
              <select {...form.register('photographerId')} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
                <option value="">未关联</option>
                {photographersQuery.data?.data.map((photographer) => (
                  <option key={photographer.id} value={photographer.id}>
                    {photographer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...form.register('featured')} className="h-4 w-4" /> 首页精选
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
