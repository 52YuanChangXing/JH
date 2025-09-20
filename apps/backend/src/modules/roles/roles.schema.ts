import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([])
});

export const updateRoleSchema = z.object({
  description: z.string().optional(),
  permissions: z.array(z.string()).optional()
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
