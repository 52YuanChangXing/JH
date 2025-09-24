import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DataTable } from '../../components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/sonner';
import {
  BookingRecord,
  createBooking,
  fetchBooking,
  fetchBookings,
  updateBooking,
  updateBookingProgress
} from '../../services/bookings';
import { fetchStudioServices } from '../../services/studio-services';
import { fetchPhotographers } from '../../services/photographers';

const bookingSchema = z.object({
  clientName: z.string().min(1, '请输入客户姓名'),
  clientEmail: z.string().email('请输入有效邮箱'),
  clientPhone: z.string().optional(),
  eventDate: z.string().optional(),
  venue: z.string().optional(),
  status: z.string().default('INQUIRY'),
  note: z.string().optional(),
  serviceId: z.string().optional(),
  photographerId: z.string().optional()
});

const progressStages = [
  { value: 'INQUIRY', label: '收到预约需求' },
  { value: 'CONSULTATION', label: '定制方案沟通' },
  { value: 'SHOOTING', label: '拍摄执行' },
  { value: 'EDITING', label: '后期剪辑' },
  { value: 'DELIVERY', label: '成片交付' }
];

const statusOptions = [
  { value: 'INQUIRY', label: '待沟通' },
  { value: 'PROPOSAL_SENT', label: '方案已发送' },
  { value: 'CONFIRMED', label: '已确认' },
  { value: 'SHOOTING', label: '拍摄中' },
  { value: 'EDITING', label: '后期制作' },
  { value: 'DELIVERED', label: '已交付' },
  { value: 'CANCELLED', label: '已取消' }
];

export function BookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, search, status],
    queryFn: () =>
      fetchBookings({
        page,
        pageSize: 8,
        search: search || undefined,
        status: status || undefined
      })
  });

  const servicesQuery = useQuery({ queryKey: ['services', 'all'], queryFn: () => fetchStudioServices({ pageSize: 50 }) });
  const photographersQuery = useQuery({ queryKey: ['photographers', 'all'], queryFn: () => fetchPhotographers({ pageSize: 50 }) });

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      eventDate: '',
      venue: '',
      status: 'INQUIRY',
      note: '',
      serviceId: '',
      photographerId: ''
    }
  });

  const openCreate = useCallback(() => {
    setCreationMode(true);
    setSelectedBookingId(null);
    form.reset({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      eventDate: '',
      venue: '',
      status: 'INQUIRY',
      note: '',
      serviceId: '',
      photographerId: ''
    });
    setDialogOpen(true);
  }, [form]);

  const openDetails = useCallback(async (booking: BookingRecord) => {
    setCreationMode(false);
    setSelectedBookingId(booking.id);
    form.reset({
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone || '',
      eventDate: booking.eventDate?.slice(0, 10) || '',
      venue: booking.venue || '',
      status: booking.status,
      note: booking.note || '',
      serviceId: booking.serviceId || booking.service?.id || '',
      photographerId: booking.photographerId || booking.photographer?.id || ''
    });
    setDialogOpen(true);
  }, [form]);

  const createMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: ({ accessCode }) => {
      toast.success(`预约已创建，客户访问口令：${accessCode}`);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setDialogOpen(false);
    },
    onError: () => toast.error('创建失败，请稍后重试')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<BookingRecord> }) => updateBooking(id, values),
    onSuccess: () => {
      toast.success('预约信息已更新');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (selectedBookingId) {
        queryClient.invalidateQueries({ queryKey: ['booking', selectedBookingId] });
      }
    },
    onError: () => toast.error('更新失败，请重试')
  });

  const progressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: { stage: string; completed?: boolean; note?: string }[] }) =>
      updateBookingProgress(id, progress),
    onSuccess: () => {
      toast.success('进度已同步');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (selectedBookingId) {
        queryClient.invalidateQueries({ queryKey: ['booking', selectedBookingId] });
      }
    },
    onError: () => toast.error('更新进度失败')
  });

  const columns = useMemo<ColumnDef<BookingRecord>[]>(
    () => [
      {
        header: '客户',
        accessorKey: 'clientName',
        cell: ({ row }) => (
          <div className="font-medium text-slate-900">
            {row.original.clientName}
            <div className="text-xs text-slate-500">{row.original.clientEmail}</div>
          </div>
        )
      },
      {
        header: '服务',
        accessorKey: 'service',
        cell: ({ row }) => row.original.service?.name || '—'
      },
      {
        header: '摄影师',
        accessorKey: 'photographer',
        cell: ({ row }) => row.original.photographer?.name || '待分配'
      },
      {
        header: '拍摄日期',
        accessorKey: 'eventDate',
        cell: ({ row }) => (row.original.eventDate ? format(new Date(row.original.eventDate), 'yyyy-MM-dd') : '待定')
      },
      {
        header: '状态',
        accessorKey: 'status',
        cell: ({ row }) => <Badge>{statusOptions.find((item) => item.value === row.original.status)?.label || row.original.status}</Badge>
      },
      {
        header: '操作',
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => openDetails(row.original)}>
            查看详情
          </Button>
        )
      }
    ],
    [openDetails]
  );

  const handleSubmit = form.handleSubmit((values) => {
    if (creationMode) {
      createMutation.mutate({
        clientName: values.clientName,
        clientEmail: values.clientEmail,
        clientPhone: values.clientPhone,
        eventDate: values.eventDate,
        venue: values.venue,
        status: values.status,
        note: values.note,
        serviceId: values.serviceId || undefined,
        photographerId: values.photographerId || undefined
      });
      return;
    }

    if (selectedBookingId) {
      updateMutation.mutate({
        id: selectedBookingId,
        values: {
          clientName: values.clientName,
          clientEmail: values.clientEmail,
          clientPhone: values.clientPhone,
          eventDate: values.eventDate,
          venue: values.venue,
          status: values.status,
          note: values.note,
          serviceId: values.serviceId || null,
          photographerId: values.photographerId || null
        }
      });
    }
  });

  const selectedBookingQuery = useQuery({
    queryKey: ['booking', selectedBookingId],
    queryFn: () => fetchBooking(selectedBookingId!),
    enabled: !!selectedBookingId && dialogOpen && !creationMode
  });

  const toggleStage = (stage: string, current?: string | null) => {
    if (!selectedBookingId) return;
    const isCompleted = Boolean(current);
    progressMutation.mutate({
      id: selectedBookingId,
      progress: [
        {
          stage,
          completed: !isCompleted
        }
      ]
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">客户预约与进度</CardTitle>
            <p className="text-sm text-slate-500">集中管理客户需求、拍摄分配与交付进度。</p>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <Input
              placeholder="搜索客户或预约号"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm"
            >
              <option value="">全部状态</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button onClick={openCreate}>新增预约</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<BookingRecord, unknown>
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
            <DialogTitle>{creationMode ? '创建预约' : '预约详情与进度'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 lg:grid-cols-2">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">客户姓名</Label>
                  <Input id="clientName" {...form.register('clientName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">邮箱</Label>
                  <Input id="clientEmail" type="email" {...form.register('clientEmail')} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">电话</Label>
                  <Input id="clientPhone" {...form.register('clientPhone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">拍摄日期</Label>
                  <Input id="eventDate" type="date" {...form.register('eventDate')} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="venue">地点</Label>
                  <Input id="venue" {...form.register('venue')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <select id="status" {...form.register('status')} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>服务套餐</Label>
                  <select {...form.register('serviceId')} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
                    <option value="">未指定</option>
                    {servicesQuery.data?.data.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>指定摄影师</Label>
                  <select
                    {...form.register('photographerId')}
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                  >
                    <option value="">未指定</option>
                    {photographersQuery.data?.data.map((photographer) => (
                      <option key={photographer.id} value={photographer.id}>
                        {photographer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">备注</Label>
                <Textarea id="note" rows={4} {...form.register('note')} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isLoading || updateMutation.isPending}>
                  {creationMode ? '创建预约' : '保存更新'}
                </Button>
              </div>
            </form>

            {!creationMode && selectedBookingId && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="text-sm font-semibold text-slate-700">进度追踪</h3>
                <div className="space-y-3">
                  {progressStages.map((stage) => {
                    const progress = selectedBookingQuery.data?.progress.find((item) => item.stage === stage.value);
                    const completed = Boolean(progress?.completedAt);
                    return (
                      <div
                        key={stage.value}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{stage.label}</p>
                          <p className="text-xs text-slate-500">
                            {completed
                              ? `完成于 ${progress?.completedAt ? format(new Date(progress.completedAt), 'MM-dd HH:mm') : ''}`
                              : '等待完成'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={completed ? 'secondary' : 'outline'}
                          onClick={() => toggleStage(stage.value, progress?.completedAt || undefined)}
                          disabled={progressMutation.isPending}
                        >
                          {completed ? '标记为未完成' : '标记完成'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
