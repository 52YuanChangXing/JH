import { Response } from 'express';
import createError from 'http-errors';

import { success } from '../../utils/http.js';
import { AuthRequest } from '../../middleware/auth.js';
import { createServiceSchema, serviceFilterSchema, updateServiceSchema } from './services.schema.js';
import { createService, deleteService, listServices, updateService } from './services.service.js';

export async function listServicesHandler(req: AuthRequest, res: Response) {
  const result = serviceFilterSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const services = await listServices(result.data);
  return success(res, services, '服务列表已获取');
}

export async function createServiceHandler(req: AuthRequest, res: Response) {
  const result = createServiceSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  const service = await createService(result.data, req.user.id);
  return success(res, service, '服务已创建', 201);
}

export async function updateServiceHandler(req: AuthRequest, res: Response) {
  const result = updateServiceSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  const service = await updateService(req.params.id, result.data, req.user.id);
  return success(res, service, '服务信息已更新');
}

export async function deleteServiceHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  await deleteService(req.params.id, req.user.id);
  return success(res, { id: req.params.id }, '服务已删除');
}
