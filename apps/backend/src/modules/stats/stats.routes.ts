import { Router } from 'express';

import { overviewHandler } from './stats.controller.js';

export const statsRouter = Router();

statsRouter.get('/overview', (req, res, next) => {
  overviewHandler(req, res).catch(next);
});
