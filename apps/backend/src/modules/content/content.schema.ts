import { z } from 'zod';

export const siteSettingSchema = z
  .object({
    key: z.string().min(1, '配置键不能为空'),
    value: z.any()
  })
  .strict();

export const testimonialSchema = z
  .object({
    name: z.string().min(1, '请填写客户名称'),
    title: z.string().optional(),
    message: z.string().min(10, '请填写评价内容'),
    rating: z.number().int().min(1).max(5).default(5),
    avatarUrl: z.string().url().optional()
  })
  .strict();

export const updateTestimonialSchema = testimonialSchema.partial();

export const faqSchema = z
  .object({
    question: z.string().min(1, '请输入问题'),
    answer: z.string().min(1, '请输入答案'),
    sortOrder: z.number().int().min(0).default(0)
  })
  .strict();

export const updateFaqSchema = faqSchema.partial();
