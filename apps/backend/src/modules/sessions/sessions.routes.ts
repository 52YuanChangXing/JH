import { Router } from 'express';

import {
  createSessionHandler,
  deleteSessionHandler,
  getSessionHandler,
  listSessionsHandler,
  updateSessionHandler
} from './sessions.controller.js';
import { authorize } from '../../middleware/auth.js';

export const sessionsRouter = Router();

sessionsRouter.get('/', (req, res, next) => {
  listSessionsHandler(req, res).catch(next);
});

sessionsRouter.get('/:id', (req, res, next) => {
  getSessionHandler(req, res).catch(next);
});

sessionsRouter.post('/', authorize('sessions:write'), (req, res, next) => {
  createSessionHandler(req, res).catch(next);
});

sessionsRouter.patch('/:id', authorize('sessions:write'), (req, res, next) => {
  updateSessionHandler(req, res).catch(next);
});

sessionsRouter.delete('/:id', authorize('sessions:write'), (req, res, next) => {
  deleteSessionHandler(req, res).catch(next);
});
