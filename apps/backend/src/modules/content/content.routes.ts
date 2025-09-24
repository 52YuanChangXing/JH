import { Router } from 'express';

import { authorize } from '../../middleware/auth.js';
import {
  createFaqHandler,
  createTestimonialHandler,
  deleteFaqHandler,
  deleteTestimonialHandler,
  listFaqsHandler,
  listSettingsHandler,
  listTestimonialsHandler,
  upsertSettingHandler,
  updateFaqHandler,
  updateTestimonialHandler
} from './content.controller.js';

export const contentRouter = Router();

contentRouter.get('/settings', authorize('content:manage'), listSettingsHandler);
contentRouter.put('/settings', authorize('content:manage'), upsertSettingHandler);

contentRouter.get('/testimonials', authorize('content:manage'), listTestimonialsHandler);
contentRouter.post('/testimonials', authorize('content:manage'), createTestimonialHandler);
contentRouter.patch('/testimonials/:id', authorize('content:manage'), updateTestimonialHandler);
contentRouter.delete('/testimonials/:id', authorize('content:manage'), deleteTestimonialHandler);

contentRouter.get('/faqs', authorize('content:manage'), listFaqsHandler);
contentRouter.post('/faqs', authorize('content:manage'), createFaqHandler);
contentRouter.patch('/faqs/:id', authorize('content:manage'), updateFaqHandler);
contentRouter.delete('/faqs/:id', authorize('content:manage'), deleteFaqHandler);
