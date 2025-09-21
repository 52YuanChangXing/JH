import { Router } from 'express';
import { authorize } from '../../middleware/auth.js';
import {
  createServiceHandler,
  deleteServiceHandler,
  listServicesHandler,
  updateServiceHandler
} from './services.controller.js';

export const servicesRouter = Router();

servicesRouter.get('/', listServicesHandler);
servicesRouter.post('/', authorize('services:manage'), createServiceHandler);
servicesRouter.patch('/:id', authorize('services:manage'), updateServiceHandler);
servicesRouter.delete('/:id', authorize('services:manage'), deleteServiceHandler);
