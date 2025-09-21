import { z } from 'zod';

export const serviceFilterSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    active: z.coerce.boolean().optional()
  })
  .strict();

export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>;

export const baseServiceSchema = z
  .object({
    name: z.string().min(1, '请输入服务名称'),
    slug: z.string().min(1, 'slug 必填'),
    summary: z.string().min(10, '请填写服务简介'),
    description: z.string().min(20, '请填写服务详情'),
    priceFrom: z.number().int().min(0),
    duration: z.number().int().min(1),
    deliverables: z.array(z.string()).min(1, '请至少提供一项交付内容'),
    isPopular: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export const createServiceSchema = baseServiceSchema;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = baseServiceSchema.partial();
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
