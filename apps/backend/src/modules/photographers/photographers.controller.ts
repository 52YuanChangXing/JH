import { Response } from 'express';
import createError from 'http-errors';

import { success } from '../../utils/http.js';
import { AuthRequest } from '../../middleware/auth.js';
import {
  createPhotographerSchema,
  photographerFilterSchema,
  updatePhotographerSchema
} from './photographers.schema.js';
import {
  createPhotographer,
  deletePhotographer,
  listPhotographers,
  updatePhotographer
} from './photographers.service.js';

export async function listPhotographersHandler(req: AuthRequest, res: Response) {
  const result = photographerFilterSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const response = await listPhotographers(result.data);
  return success(res, response, '摄影师列表已获取');
}

export async function createPhotographerHandler(req: AuthRequest, res: Response) {
  const result = createPhotographerSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  const photographer = await createPhotographer(result.data, req.user.id);
  return success(res, photographer, '摄影师已创建', 201);
}

export async function updatePhotographerHandler(req: AuthRequest, res: Response) {
  const result = updatePhotographerSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  const photographer = await updatePhotographer(req.params.id, result.data, req.user.id);
  return success(res, photographer, '摄影师信息已更新');
}

export async function deletePhotographerHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }
  await deletePhotographer(req.params.id, req.user.id);
  return success(res, { id: req.params.id }, '摄影师已删除');
}
