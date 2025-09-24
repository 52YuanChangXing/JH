import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../components/ui/sonner';
import {
  createFaq,
  createTestimonial,
  deleteFaq,
  deleteTestimonial,
  fetchFaqs,
  fetchSiteSettings,
  fetchTestimonials,
  upsertSiteSetting,
  updateFaq,
  updateTestimonial
} from '../../services/content';
import { FaqRecord, TestimonialRecord } from '../../services/public';

const heroSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  ctaPrimary: z.string().min(1),
  ctaSecondary: z.string().min(1),
  background: z.string().url('请输入有效图片地址')
});

const metricsSchema = z.object({
  experienceYears: z.coerce.number().min(0),
  globalCities: z.coerce.number().min(0),
  satisfaction: z.coerce.number().min(0).max(100),
  awards: z.coerce.number().min(0)
});

const featureSchema = z.object({
  features: z.string().min(1, '请至少输入一行特性')
});

const testimonialSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  message: z.string().min(1),
  rating: z.coerce.number().min(1).max(5),
  avatarUrl: z.string().url().optional()
});

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.coerce.number().min(0)
});

export function ContentPage() {
  const queryClient = useQueryClient();
  const [testimonialDialog, setTestimonialDialog] = useState<{ open: boolean; record?: TestimonialRecord }>(
    { open: false }
  );
  const [faqDialog, setFaqDialog] = useState<{ open: boolean; record?: FaqRecord }>({ open: false });

  const settingsQuery = useQuery({
    queryKey: ['content-settings'],
    queryFn: () => fetchSiteSettings(['homepage.hero', 'homepage.metrics', 'homepage.features'])
  });
  const testimonialsQuery = useQuery({ queryKey: ['testimonials'], queryFn: fetchTestimonials });
  const faqsQuery = useQuery({ queryKey: ['faqs'], queryFn: fetchFaqs });

  const heroForm = useForm<z.infer<typeof heroSchema>>({
    resolver: zodResolver(heroSchema)
  });
  const metricsForm = useForm<z.infer<typeof metricsSchema>>({ resolver: zodResolver(metricsSchema) });
  const featureForm = useForm<z.infer<typeof featureSchema>>({ resolver: zodResolver(featureSchema) });

  useEffect(() => {
    if (!settingsQuery.data) return;
    const heroSetting = settingsQuery.data.find((item) => item.key === 'homepage.hero');
    const metricsSetting = settingsQuery.data.find((item) => item.key === 'homepage.metrics');
    const featureSetting = settingsQuery.data.find((item) => item.key === 'homepage.features');

    if (heroSetting) {
      heroForm.reset(heroSetting.value);
    }
    if (metricsSetting) {
      metricsForm.reset(metricsSetting.value);
    }
    if (featureSetting) {
      const features = (featureSetting.value as { title: string; description: string }[]).map(
        (item) => `${item.title}|${item.description}`
      );
      featureForm.reset({ features: features.join('\n') });
    }
  }, [featureForm, heroForm, metricsForm, settingsQuery.data]);

  const heroMutation = useMutation({
    mutationFn: (values: z.infer<typeof heroSchema>) =>
      upsertSiteSetting({ key: 'homepage.hero', value: values }),
    onSuccess: () => {
      toast.success('英雄区内容已更新');
      queryClient.invalidateQueries({ queryKey: ['content-settings'] });
    },
    onError: () => toast.error('保存失败')
  });

  const metricsMutation = useMutation({
    mutationFn: (values: z.infer<typeof metricsSchema>) =>
      upsertSiteSetting({ key: 'homepage.metrics', value: values }),
    onSuccess: () => {
      toast.success('关键指标已更新');
      queryClient.invalidateQueries({ queryKey: ['content-settings'] });
    },
    onError: () => toast.error('保存失败')
  });

  const featureMutation = useMutation({
    mutationFn: (values: z.infer<typeof featureSchema>) => {
      const features = values.features
        .split('\n')
        .map((line) => line.split('|').map((item) => item.trim()))
        .filter((pair) => pair.length === 2)
        .map(([title, description]) => ({ title, description }));
      return upsertSiteSetting({ key: 'homepage.features', value: features });
    },
    onSuccess: () => {
      toast.success('服务亮点已更新');
      queryClient.invalidateQueries({ queryKey: ['content-settings'] });
    },
    onError: () => toast.error('保存失败')
  });

  const testimonialMutation = useMutation({
    mutationFn: (values: z.infer<typeof testimonialSchema>) =>
      testimonialDialog.record
        ? updateTestimonial(testimonialDialog.record.id, values)
        : createTestimonial(values),
    onSuccess: () => {
      toast.success('客户评价已保存');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      setTestimonialDialog({ open: false });
    },
    onError: () => toast.error('操作失败')
  });

  const faqMutation = useMutation({
    mutationFn: (values: z.infer<typeof faqSchema>) =>
      faqDialog.record ? updateFaq(faqDialog.record.id, values) : createFaq(values),
    onSuccess: () => {
      toast.success('常见问题已保存');
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setFaqDialog({ open: false });
    },
    onError: () => toast.error('操作失败')
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => {
      toast.success('已删除评价');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
    onError: () => toast.error('删除失败')
  });

  const deleteFaqMutation = useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => {
      toast.success('已删除常见问题');
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
    onError: () => toast.error('删除失败')
  });

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader>
          <CardTitle>首页英雄区</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={heroForm.handleSubmit((values) => heroMutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="title">主标题</Label>
              <Input id="title" {...heroForm.register('title')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">副标题</Label>
              <Input id="subtitle" {...heroForm.register('subtitle')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">简介</Label>
              <Textarea id="description" rows={3} {...heroForm.register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaPrimary">主按钮文案</Label>
              <Input id="ctaPrimary" {...heroForm.register('ctaPrimary')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaSecondary">次按钮文案</Label>
              <Input id="ctaSecondary" {...heroForm.register('ctaSecondary')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="background">背景图 URL</Label>
              <Input id="background" {...heroForm.register('background')} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <Button type="submit" disabled={heroMutation.isPending}>
                保存英雄区
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader>
          <CardTitle>关键指标</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-4"
            onSubmit={metricsForm.handleSubmit((values) => metricsMutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="experienceYears">团队年资</Label>
              <Input id="experienceYears" type="number" {...metricsForm.register('experienceYears')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="globalCities">服务城市</Label>
              <Input id="globalCities" type="number" {...metricsForm.register('globalCities')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="satisfaction">好评率</Label>
              <Input id="satisfaction" type="number" {...metricsForm.register('satisfaction')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awards">获奖数量</Label>
              <Input id="awards" type="number" {...metricsForm.register('awards')} />
            </div>
            <div className="md:col-span-4 flex justify-end gap-3">
              <Button type="submit" disabled={metricsMutation.isPending}>
                保存指标
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader>
          <CardTitle>服务亮点</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={featureForm.handleSubmit((values) => featureMutation.mutate(values))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="features">每行使用 “标题|描述” 格式</Label>
              <Textarea id="features" rows={4} {...featureForm.register('features')} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={featureMutation.isPending}>
                保存亮点
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none bg-white/80 shadow-md backdrop-blur">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>客户评价</CardTitle>
            <Button size="sm" onClick={() => setTestimonialDialog({ open: true })}>
              新增评价
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {testimonialsQuery.data?.map((testimonial) => (
              <div key={testimonial.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">评分 {testimonial.rating}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTestimonialDialog({ open: true, record: testimonial })}
                    >
                      编辑
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteTestimonialMutation.mutate(testimonial.id)}>
                      删除
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{testimonial.message}</p>
              </div>
            ))}
            {testimonialsQuery.data?.length === 0 && <p className="text-sm text-slate-500">暂无客户评价。</p>}
          </CardContent>
        </Card>

        <Card className="border-none bg-white/80 shadow-md backdrop-blur">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>常见问题</CardTitle>
            <Button size="sm" onClick={() => setFaqDialog({ open: true })}>
              新增 FAQ
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqsQuery.data?.map((faq) => (
              <div key={faq.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{faq.question}</p>
                    <p className="text-xs text-slate-400">排序 {faq.sortOrder}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setFaqDialog({ open: true, record: faq })}>
                      编辑
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteFaqMutation.mutate(faq.id)}>
                      删除
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
              </div>
            ))}
            {faqsQuery.data?.length === 0 && <p className="text-sm text-slate-500">暂无常见问题。</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={testimonialDialog.open} onOpenChange={(open) => setTestimonialDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{testimonialDialog.record ? '编辑评价' : '新增评价'}</DialogTitle>
          </DialogHeader>
          <TestimonialForm
            defaultValues={testimonialDialog.record}
            onSubmit={(values) => testimonialMutation.mutate(values)}
            submitting={testimonialMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={faqDialog.open} onOpenChange={(open) => setFaqDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{faqDialog.record ? '编辑 FAQ' : '新增 FAQ'}</DialogTitle>
          </DialogHeader>
          <FaqForm defaultValues={faqDialog.record} onSubmit={(values) => faqMutation.mutate(values)} submitting={faqMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TestimonialForm({
  defaultValues,
  onSubmit,
  submitting
}: {
  defaultValues?: TestimonialRecord;
  onSubmit: (values: z.infer<typeof testimonialSchema>) => void;
  submitting: boolean;
}) {
  const form = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          title: defaultValues.title || '',
          message: defaultValues.message,
          rating: defaultValues.rating,
          avatarUrl: defaultValues.avatarUrl || ''
        }
      : { name: '', title: '', message: '', rating: 5, avatarUrl: '' }
  });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="name">姓名/公司</Label>
        <Input id="name" {...form.register('name')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">身份或头衔</Label>
        <Input id="title" {...form.register('title')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">评价内容</Label>
        <Textarea id="message" rows={4} {...form.register('message')} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rating">评分（1-5）</Label>
          <Input id="rating" type="number" {...form.register('rating')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatarUrl">头像地址</Label>
          <Input id="avatarUrl" {...form.register('avatarUrl')} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={submitting}>
          保存评价
        </Button>
      </div>
    </form>
  );
}

function FaqForm({
  defaultValues,
  onSubmit,
  submitting
}: {
  defaultValues?: FaqRecord;
  onSubmit: (values: z.infer<typeof faqSchema>) => void;
  submitting: boolean;
}) {
  const form = useForm<z.infer<typeof faqSchema>>({
    resolver: zodResolver(faqSchema),
    defaultValues: defaultValues
      ? { question: defaultValues.question, answer: defaultValues.answer, sortOrder: defaultValues.sortOrder }
      : { question: '', answer: '', sortOrder: 0 }
  });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="question">问题</Label>
        <Input id="question" {...form.register('question')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="answer">解答</Label>
        <Textarea id="answer" rows={4} {...form.register('answer')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sortOrder">排序</Label>
        <Input id="sortOrder" type="number" {...form.register('sortOrder')} />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={submitting}>
          保存 FAQ
        </Button>
      </div>
    </form>
  );
}
