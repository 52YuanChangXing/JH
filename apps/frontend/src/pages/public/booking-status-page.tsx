import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchBookingProgress } from '../../services/public';
import { Card, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';

export function BookingStatusPage() {
  const [reference, setReference] = useState('');
  const [code, setCode] = useState('');

  const mutation = useMutation({
    mutationFn: () => fetchBookingProgress(reference.trim(), code.trim())
  });

  const booking = mutation.data;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">查询预约进度</h1>
        <p className="max-w-2xl text-sm text-slate-500">
          输入预约编号与访问口令，即可实时查看拍摄排期、团队指派以及制作进度。口令在预约成功时通过页面提示提供。
        </p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="reference">预约编号</Label>
            <Input id="reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="例如：AB12CD34" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">访问口令</Label>
            <Input id="code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="6 位数字" />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              查询进度
            </Button>
          </div>
        </div>
        {mutation.isError && <p className="mt-4 text-sm text-red-500">查询失败，请检查编号或口令是否正确。</p>}
      </div>

      {booking && (
        <Card className="border-none bg-white/80 shadow-lg">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-400">预约编号</p>
                <p className="text-lg font-semibold text-slate-900">{booking.reference}</p>
              </div>
              <Badge>{booking.status}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">客户信息</p>
                <p className="mt-2 text-sm text-slate-600">{booking.clientName}</p>
                <p className="text-xs text-slate-500">{booking.clientEmail}</p>
                {booking.clientPhone && <p className="text-xs text-slate-500">{booking.clientPhone}</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">拍摄安排</p>
                <p className="mt-2 text-sm text-slate-600">{booking.service?.name || '待定套餐'}</p>
                {booking.photographer && <p className="text-xs text-slate-500">摄影师：{booking.photographer.name}</p>}
                {booking.eventDate && <p className="text-xs text-slate-500">拍摄日期：{format(new Date(booking.eventDate), 'yyyy-MM-dd')}</p>}
                {booking.venue && <p className="text-xs text-slate-500">地点：{booking.venue}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">进度节点</p>
              <div className="space-y-2">
                {booking.progress
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((stage) => (
                    <div
                      key={stage.id}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${stage.completedAt ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      <div>
                        <p className="font-medium">{stage.label}</p>
                        {stage.completedAt && (
                          <p className="text-xs">完成时间：{format(new Date(stage.completedAt), 'MM-dd HH:mm')}</p>
                        )}
                      </div>
                      <Badge variant={stage.completedAt ? 'default' : 'outline'}>
                        {stage.completedAt ? '已完成' : '进行中'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
