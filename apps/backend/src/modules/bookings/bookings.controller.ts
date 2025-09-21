import { Response } from 'express';
import createError from 'http-errors';
import { success } from '../../utils/http.js';
import { AuthRequest } from '../../middleware/auth.js';
import { bookingFilterSchema, createBookingSchema, updateBookingProgressSchema, updateBookingSchema } from './bookings.schema.js';
import {
  createBooking,
  getBooking,
  listBookings,
  updateBooking,
  updateBookingProgress
} from './bookings.service.js';

export async function listBookingsHandler(req: AuthRequest, res: Response) {
  const result = bookingFilterSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const bookings = await listBookings(result.data);
  return success(res, bookings, '预约列表已获取');
}

export async function getBookingHandler(req: AuthRequest, res: Response) {
  const booking = await getBooking(req.params.id);
  if (!booking) {
    throw createError(404, '预约不存在');
  }
  return success(res, booking, '预约详情已获取');
}

export async function createBookingHandler(req: AuthRequest, res: Response) {
  const result = createBookingSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  const { booking, accessCode } = await createBooking(result.data, req.user.id);
  return success(res, { booking, accessCode }, '预约已创建', 201);
}

export async function updateBookingHandler(req: AuthRequest, res: Response) {
  const result = updateBookingSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  const booking = await updateBooking(req.params.id, result.data, req.user.id);
  return success(res, booking, '预约已更新');
}

export async function updateBookingProgressHandler(req: AuthRequest, res: Response) {
  const result = updateBookingProgressSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }

  if (!req.user?.id) {
    throw createError(401, '认证信息缺失');
  }

  const booking = await updateBookingProgress(req.params.id, result.data, req.user.id);
  if (!booking) {
    throw createError(404, '预约不存在');
  }
  return success(res, booking, '预约进度已更新');
}
