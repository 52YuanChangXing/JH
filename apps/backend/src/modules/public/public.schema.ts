import { z } from 'zod';
import { bookingFilterSchema, publicBookingSchema, publicProgressQuerySchema } from '../bookings/bookings.schema.js';

export const publicPortfolioFilterSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(9),
    category: z.string().optional(),
    photographer: z.string().optional()
  })
  .strict();

export const publicPhotographerFilterSchema = z
  .object({
    featured: z.coerce.boolean().optional()
  })
  .strict();

export { bookingFilterSchema as adminBookingQuerySchema };
export { publicBookingSchema, publicProgressQuerySchema };
