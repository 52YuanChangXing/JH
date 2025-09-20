import { Router } from 'express';
import {
  createUserHandler,
  deleteUserHandler,
  listUsersHandler,
  updateUserHandler
} from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/', (req, res, next) => {
  listUsersHandler(req, res).catch(next);
});

usersRouter.post('/', (req, res, next) => {
  createUserHandler(req, res).catch(next);
});

usersRouter.patch('/:id', (req, res, next) => {
  updateUserHandler(req, res).catch(next);
});

usersRouter.delete('/:id', (req, res, next) => {
  deleteUserHandler(req, res).catch(next);
});
