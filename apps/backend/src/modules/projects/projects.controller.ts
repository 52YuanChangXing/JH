import { Response } from 'express';
import createError from 'http-errors';

import { AuthRequest } from '../../middleware/auth.js';
import { success } from '../../utils/http.js';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from './projects.service.js';
import {
  createProjectSchema,
  projectFilterSchema,
  updateProjectSchema
} from './projects.schema.js';

export async function listProjectsHandler(req: AuthRequest, res: Response) {
  const result = projectFilterSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, 'Invalid filter parameters');
  }
  const payload = await listProjects(result.data);
  return success(res, payload, 'Projects fetched');
}

export async function getProjectHandler(req: AuthRequest, res: Response) {
  const project = await getProject(req.params.id);
  if (!project) {
    throw createError(404, 'Project not found');
  }
  return success(res, project, 'Project fetched');
}

export async function createProjectHandler(req: AuthRequest, res: Response) {
  const result = createProjectSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const project = await createProject(result.data, req.user?.id ?? 'system');
  return success(res, project, 'Project created', 201);
}

export async function updateProjectHandler(req: AuthRequest, res: Response) {
  const result = updateProjectSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const project = await updateProject(req.params.id, result.data, req.user?.id ?? 'system');
  return success(res, project, 'Project updated');
}

export async function deleteProjectHandler(req: AuthRequest, res: Response) {
  await deleteProject(req.params.id, req.user?.id ?? 'system');
  return success(res, { id: req.params.id }, 'Project deleted');
}
