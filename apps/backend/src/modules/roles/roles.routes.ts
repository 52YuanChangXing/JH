import { Router } from 'express';
import {
  createRoleHandler,
  deleteRoleHandler,
  listRolesHandler,
  updateRoleHandler
} from './roles.controller.js';

export const rolesRouter = Router();

rolesRouter.get('/', (req, res, next) => {
  listRolesHandler(req, res).catch(next);
});

rolesRouter.post('/', (req, res, next) => {
  createRoleHandler(req, res).catch(next);
});

rolesRouter.patch('/:id', (req, res, next) => {
  updateRoleHandler(req, res).catch(next);
});

rolesRouter.delete('/:id', (req, res, next) => {
  deleteRoleHandler(req, res).catch(next);
});
