import { Router } from 'express';

import {
  createPublicBookingHandler,
  getLandingHandler,
  getPublicProgressHandler,
  listPublicPhotographersHandler,
  listPublicPortfolioHandler,
  listPublicServicesHandler
} from './public.controller.js';

export const publicRouter = Router();

publicRouter.get('/home', getLandingHandler);
publicRouter.get('/services', listPublicServicesHandler);
publicRouter.get('/photographers', listPublicPhotographersHandler);
publicRouter.get('/portfolio', listPublicPortfolioHandler);
publicRouter.post('/bookings', createPublicBookingHandler);
publicRouter.get('/bookings/:reference/progress', getPublicProgressHandler);
