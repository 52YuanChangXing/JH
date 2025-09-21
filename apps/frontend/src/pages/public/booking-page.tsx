import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createBookingRequest, fetchPublicPhotographers, fetchPublicServices } from '../../services/public';
import { Card, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/sonner';

const bookingSchema = z.object({
  clientName: z.string().min(1, '请输入姓名'),
  clientEmail: z.string().email('请输入有效邮箱'),
  clientPhone: z.string().min(6, '请输入联系电话'),
  eventDate: z.string().optional(),
  venue: z.string().optional(),
  serviceId: z.string().optional(),
  photographerId: z.string().optional(),
  note: z.string().optional()
});

export function BookingRequestPage() {
  const [confirmation, setConfirmation] = useState<{ reference: string; accessCode: string } | null>(null);
  const servicesQuery = useQuery({ queryKey: ['public-services'], queryFn: fetchPublicServices });
  const photographersQuery = useQuery({ queryKey: ['public-photographers'], queryFn: () => fetchPublicPhotographers() });

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      eventDate: '',
      venue: '',
      serviceId: '',
      photographerId: '',
      note: ''
    }
  });

  const mutation = useMutation({
    mutationFn: createBookingRequest,
    onSuccess: (payload) => {
      setConfirmation(payload);
      toast.success('预约提交成功，顾问将尽快联系您');
      form.reset({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        eventDate: '',
        venue: '',
        serviceId: '',
        photographerId: '',
        note: ''
      });
    },
    onError: () => toast.error('提交失败，请稍后重试')
  });

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">预约拍摄 · 定制创意方案</h1>
        <p className="text-sm text-slate-500">
          提交需求后，专业顾问将在 24 小时内与您联系，了解拍摄愿景、预算以及档期需求，并提供最适合的团队与流程安排。
        </p>
        <Card className="border-none bg-white/80 shadow-lg">
          <CardContent className="space-y-3 p-6 text-sm text-slate-600">
            <p>• 预约成功后将提供一个 6 位访问口令，随时查看拍摄进度。</p>
            <p>• 支持全球旅拍、目的地婚礼以及品牌广告大片。</p>
            <p>• 提供前期创意策划、现场执行与后期交付的一站式服务。</p>
          </CardContent>
        </Card>
        {confirmation && (
          <Card className="border-none bg-emerald-50 text-emerald-700 shadow-lg">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-semibold">预约已创建</p>
              <p className="text-sm">预约编号：{confirmation.reference}</p>
              <p className="text-sm">查询口令：{confirmation.accessCode}</p>
              <p className="text-xs text-emerald-600">请妥善保存以上信息，用于查看拍摄进度。</p>
            </CardContent>
          </Card>
        )}
      </div>

      <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clientName">姓名</Label>
            <Input id="clientName" {...form.register('clientName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">邮箱</Label>
            <Input id="clientEmail" type="email" {...form.register('clientEmail')} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clientPhone">联系电话</Label>
            <Input id="clientPhone" {...form.register('clientPhone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventDate">预计拍摄日期</Label>
            <Input id="eventDate" type="date" {...form.register('eventDate')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">拍摄地点/场景</Label>
          <Input id="venue" {...form.register('venue')} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>意向服务</Label>
            <select {...form.register('serviceId')} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
              <option value="">暂未确定</option>
              {servicesQuery.data?.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}（¥{service.priceFrom.toLocaleString()} 起）
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>意向摄影师</Label>
            <select {...form.register('photographerId')} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
              <option value="">由顾问推荐</option>
              {photographersQuery.data?.map((photographer) => (
                <option key={photographer.id} value={photographer.id}>
                  {photographer.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">更多想法或要求</Label>
          <Textarea id="note" rows={4} placeholder="例如希望加入父母访谈、需要航拍团队或目的地旅拍等" {...form.register('note')} />
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          提交预约请求
        </Button>
      </form>
    </div>
  );
}
