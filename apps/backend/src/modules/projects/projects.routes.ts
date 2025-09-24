import { Router } from 'express';

import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler
} from './projects.controller.js';
import { authorize } from '../../middleware/auth.js';

export const projectsRouter = Router();

projectsRouter.get('/', (req, res, next) => {
  listProjectsHandler(req, res).catch(next);
});

projectsRouter.get('/:id', (req, res, next) => {
  getProjectHandler(req, res).catch(next);
});

projectsRouter.post('/', authorize('projects:write'), (req, res, next) => {
  createProjectHandler(req, res).catch(next);
});

projectsRouter.patch('/:id', authorize('projects:write'), (req, res, next) => {
  updateProjectHandler(req, res).catch(next);
});

projectsRouter.delete('/:id', authorize('projects:write'), (req, res, next) => {
  deleteProjectHandler(req, res).catch(next);
});
