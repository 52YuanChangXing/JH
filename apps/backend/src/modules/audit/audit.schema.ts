import { z } from 'zod';

export const auditFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  action: z.string().optional(),
  actor: z.string().optional()
});

export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
