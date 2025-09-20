import { SessionStatus, SessionType } from '@prisma/client';
import { z } from 'zod';

export const sessionFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(10),
  projectId: z.string().optional(),
  status: z.nativeEnum(SessionStatus).optional()
});

export const createSessionSchema = z.object({
  projectId: z.string(),
  title: z.string().min(2),
  sessionType: z.nativeEnum(SessionType),
  status: z.nativeEnum(SessionStatus).default(SessionStatus.SCHEDULED),
  scheduledDate: z.string().datetime().optional(),
  deliveryDate: z.string().datetime().optional(),
  location: z.string().optional(),
  description: z.string().optional()
});

export const updateSessionSchema = createSessionSchema.partial();

export type SessionFilterInput = z.infer<typeof sessionFilterSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
