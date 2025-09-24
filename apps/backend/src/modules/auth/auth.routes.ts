import { Router } from 'express';

import { authenticate, enrichUser } from '../../middleware/auth.js';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', (req, res, next) => {
  registerHandler(req, res).catch(next);
});

authRouter.post('/login', (req, res, next) => {
  loginHandler(req, res).catch(next);
});

authRouter.post('/refresh', (req, res, next) => {
  refreshHandler(req, res).catch(next);
});

authRouter.post('/logout', (req, res, next) => {
  logoutHandler(req, res).catch(next);
});

authRouter.get('/me', authenticate, enrichUser, (req, res, next) => {
  meHandler(req, res).catch(next);
});
