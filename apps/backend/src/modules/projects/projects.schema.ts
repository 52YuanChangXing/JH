import { ProjectStatus } from '@prisma/client';
import { z } from 'zod';

export const projectFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(10),
  status: z.nativeEnum(ProjectStatus).optional(),
  search: z.string().optional()
});

export const createProjectSchema = z.object({
  title: z.string().min(2),
  client: z.string().min(2),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  budget: z.number().optional(),
  location: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional()
});

export const updateProjectSchema = createProjectSchema.partial();

export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
