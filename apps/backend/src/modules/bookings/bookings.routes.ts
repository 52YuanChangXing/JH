import { Router } from 'express';
import { authorize } from '../../middleware/auth.js';
import {
  createBookingHandler,
  getBookingHandler,
  listBookingsHandler,
  updateBookingHandler,
  updateBookingProgressHandler
} from './bookings.controller.js';

export const bookingsRouter = Router();

bookingsRouter.get('/', listBookingsHandler);
bookingsRouter.get('/:id', getBookingHandler);
bookingsRouter.post('/', authorize('bookings:manage'), createBookingHandler);
bookingsRouter.patch('/:id', authorize('bookings:manage'), updateBookingHandler);
bookingsRouter.patch('/:id/progress', authorize('bookings:manage'), updateBookingProgressHandler);
