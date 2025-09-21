import { BookingStage, BookingStatus } from '@prisma/client';
import { z } from 'zod';

export const bookingFilterSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    status: z.nativeEnum(BookingStatus).optional(),
    search: z.string().trim().min(1).optional(),
    serviceId: z.string().trim().min(1).optional(),
    photographerId: z.string().trim().min(1).optional(),
    from: z.string().optional(),
    to: z.string().optional()
  })
  .strict();

export type BookingFilterInput = z.infer<typeof bookingFilterSchema>;

export const createBookingSchema = z
  .object({
    clientName: z.string().min(1, '客户姓名不能为空'),
    clientEmail: z.string().email('请输入有效的邮箱地址'),
    clientPhone: z.string().trim().min(6).max(30).optional(),
    eventDate: z.string().optional(),
    venue: z.string().trim().optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    note: z.string().optional(),
    serviceId: z.string().optional(),
    photographerId: z.string().optional(),
    accessCode: z.string().length(6).optional()
  })
  .strict();

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = createBookingSchema.partial();
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

export const updateBookingProgressSchema = z
  .object({
    progress: z
      .array(
        z.object({
          stage: z.nativeEnum(BookingStage),
          completed: z.boolean().optional(),
          note: z.string().optional()
        })
      )
      .min(1, '至少需要一个进度更新')
  })
  .strict();

export type UpdateBookingProgressInput = z.infer<typeof updateBookingProgressSchema>;

export const publicBookingSchema = z
  .object({
    clientName: z.string().min(1, '请输入姓名'),
    clientEmail: z.string().email('请输入有效邮箱'),
    clientPhone: z.string().trim().min(6).max(30).optional(),
    eventDate: z.string().optional(),
    venue: z.string().optional(),
    serviceId: z.string().optional(),
    photographerId: z.string().optional(),
    note: z.string().optional()
  })
  .strict();

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;

export const publicProgressQuerySchema = z
  .object({
    code: z.string().min(4, '请输入访问口令')
  })
  .strict();

export type PublicProgressQuery = z.infer<typeof publicProgressQuerySchema>;
