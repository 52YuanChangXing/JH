import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50),
  roles: z.array(z.string()).default([])
});

export const updateUserSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  password: z.string().min(8).optional(),
  roles: z.array(z.string()).optional()
});

export const queryUserSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional()
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type QueryUserInput = z.infer<typeof queryUserSchema>;
