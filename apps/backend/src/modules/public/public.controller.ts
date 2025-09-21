import { Request, Response } from 'express';
import createError from 'http-errors';
import { success } from '../../utils/http.js';
import {
  createPublicBookingRequest,
  getLandingContent,
  getPublicProgress,
  listPublicPhotographers,
  listPublicPortfolio,
  listPublicServices
} from './public.service.js';
import { publicBookingSchema, publicProgressQuerySchema } from '../bookings/bookings.schema.js';
import { publicPortfolioFilterSchema, publicPhotographerFilterSchema } from './public.schema.js';

export async function getLandingHandler(_req: unknown, res: Response) {
  const payload = await getLandingContent();
  return success(res, payload, '网站内容已获取');
}

export async function listPublicServicesHandler(_req: unknown, res: Response) {
  const services = await listPublicServices();
  return success(res, services, '服务列表已获取');
}

export async function listPublicPhotographersHandler(req: Request, res: Response) {
  const result = publicPhotographerFilterSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const data = await listPublicPhotographers(result.data);
  return success(res, data, '摄影师列表已获取');
}

export async function listPublicPortfolioHandler(req: Request, res: Response) {
  const result = publicPortfolioFilterSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const data = await listPublicPortfolio(result.data);
  return success(res, data, '作品集列表已获取');
}

export async function createPublicBookingHandler(req: Request, res: Response) {
  const result = publicBookingSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const payload = await createPublicBookingRequest(result.data);
  return success(res, payload, '预约提交成功，我们会尽快联系您', 201);
}

export async function getPublicProgressHandler(req: Request, res: Response) {
  const result = publicProgressQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  const progress = await getPublicProgress(req.params.reference, result.data.code);
  if (progress === null) {
    throw createError(404, '预约不存在');
  }
  if (progress === false) {
    throw createError(401, '访问口令错误');
  }

  return success(res, progress, '预约进度已获取');
}
