import { z } from 'zod';

export const photographerFilterSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    featured: z.coerce.boolean().optional()
  })
  .strict();

export type PhotographerFilterInput = z.infer<typeof photographerFilterSchema>;

export const basePhotographerSchema = z
  .object({
    name: z.string().min(1, '姓名不能为空'),
    slug: z.string().min(1, 'slug 必填'),
    avatarUrl: z.string().url('请输入有效的头像地址').optional(),
    bio: z.string().min(10, '请填写详细介绍'),
    tagline: z.string().optional(),
    specialties: z.array(z.string()).min(1, '至少选择一个擅长领域'),
    experienceYears: z.number().int().min(0).max(60),
    accolades: z.array(z.string()).optional().default([]),
    socialLinks: z.record(z.string()).optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export const createPhotographerSchema = basePhotographerSchema;
export type CreatePhotographerInput = z.infer<typeof createPhotographerSchema>;

export const updatePhotographerSchema = basePhotographerSchema.partial();
export type UpdatePhotographerInput = z.infer<typeof updatePhotographerSchema>;
