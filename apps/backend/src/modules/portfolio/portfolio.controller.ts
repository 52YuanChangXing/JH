import { Response } from 'express';
import createError from 'http-errors';
import { success } from '../../utils/http.js';
import { AuthRequest } from '../../middleware/auth.js';
import {
  createPortfolioSchema,
  portfolioFilterSchema,
  updatePortfolioSchema
} from './portfolio.schema.js';
import {
  createPortfolioItem,
  deletePortfolioItem,
  listPortfolio,
  updatePortfolioItem
} from './portfolio.service.js';

export async function listPortfolioHandler(req: AuthRequest, res: Response) {
  const result = portfolioFilterSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const response = await listPortfolio(result.data);
  return success(res, response, '作品集列表已获取');
}

export async function createPortfolioHandler(req: AuthRequest, res: Response) {
  const result = createPortfolioSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  const item = await createPortfolioItem(result.data, req.user.id);
  return success(res, item, '作品已创建', 201);
}

export async function updatePortfolioHandler(req: AuthRequest, res: Response) {
  const result = updatePortfolioSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  const item = await updatePortfolioItem(req.params.id, result.data, req.user.id);
  return success(res, item, '作品已更新');
}

export async function deletePortfolioHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }
  await deletePortfolioItem(req.params.id, req.user.id);
  return success(res, { id: req.params.id }, '作品已删除');
}
