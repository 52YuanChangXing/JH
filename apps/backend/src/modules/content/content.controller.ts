import { Response } from 'express';
import createError from 'http-errors';

import { AuthRequest } from '../../middleware/auth.js';
import { success } from '../../utils/http.js';
import {
  createFaq,
  createTestimonial,
  deleteFaq,
  deleteTestimonial,
  listFaqs,
  listSiteSettings,
  listTestimonials,
  upsertSiteSetting,
  updateFaq,
  updateTestimonial
} from './content.service.js';

export async function listSettingsHandler(req: AuthRequest, res: Response) {
  const keys = Array.isArray(req.query.keys) ? (req.query.keys as string[]) : undefined;
  const settings = await listSiteSettings(keys);
  return success(res, settings, '站点配置已获取');
}

export async function upsertSettingHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }
  const setting = await upsertSiteSetting(req.body, req.user.id);
  return success(res, setting, '站点配置已更新');
}

export async function listTestimonialsHandler(_req: AuthRequest, res: Response) {
  const data = await listTestimonials();
  return success(res, data, '客户评价已获取');
}

export async function createTestimonialHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }
  const testimonial = await createTestimonial(req.body, req.user.id);
  return success(res, testimonial, '评价已创建', 201);
}

export async function updateTestimonialHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }
  const testimonial = await updateTestimonial(req.params.id, req.body, req.user.id);
  return success(res, testimonial, '评价已更新');
}

export async function deleteTestimonialHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }
  await deleteTestimonial(req.params.id, req.user.id);
  return success(res, { id: req.params.id }, '评价已删除');
}

export async function listFaqsHandler(_req: AuthRequest, res: Response) {
  const data = await listFaqs();
  return success(res, data, '常见问题已获取');
}

export async function createFaqHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }
  const faq = await createFaq(req.body, req.user.id);
  return success(res, faq, '常见问题已创建', 201);
}

export async function updateFaqHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }
  const faq = await updateFaq(req.params.id, req.body, req.user.id);
  return success(res, faq, '常见问题已更新');
}

export async function deleteFaqHandler(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }
  await deleteFaq(req.params.id, req.user.id);
  return success(res, { id: req.params.id }, '常见问题已删除');
}
