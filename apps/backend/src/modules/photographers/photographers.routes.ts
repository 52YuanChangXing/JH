import { Router } from 'express';
import { authorize } from '../../middleware/auth.js';
import {
  createPhotographerHandler,
  deletePhotographerHandler,
  listPhotographersHandler,
  updatePhotographerHandler
} from './photographers.controller.js';

export const photographersRouter = Router();

photographersRouter.get('/', listPhotographersHandler);
photographersRouter.post('/', authorize('photographers:manage'), createPhotographerHandler);
photographersRouter.patch('/:id', authorize('photographers:manage'), updatePhotographerHandler);
photographersRouter.delete('/:id', authorize('photographers:manage'), deletePhotographerHandler);
