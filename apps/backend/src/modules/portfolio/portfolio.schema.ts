import { z } from 'zod';

export const portfolioFilterSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(12),
    search: z.string().trim().optional(),
    category: z.string().optional(),
    photographerId: z.string().optional(),
    featured: z.coerce.boolean().optional()
  })
  .strict();

export type PortfolioFilterInput = z.infer<typeof portfolioFilterSchema>;

export const basePortfolioSchema = z
  .object({
    title: z.string().min(1, '请输入作品标题'),
    slug: z.string().min(1, 'slug 必填'),
    coverImageUrl: z.string().url('请输入有效封面图地址'),
    galleryImages: z.array(z.string().url()).min(1, '请至少上传一张作品图片'),
    description: z.string().optional(),
    location: z.string().optional(),
    shotDate: z.string().optional(),
    categories: z.array(z.string()).min(1, '请选择作品分类'),
    featured: z.boolean().optional(),
    photographerId: z.string().optional()
  })
  .strict();

export const createPortfolioSchema = basePortfolioSchema;
export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;

export const updatePortfolioSchema = basePortfolioSchema.partial();
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
