import { Router } from 'express';

import { listAuditLogsHandler } from './audit.controller.js';

export const auditRouter = Router();

auditRouter.get('/', (req, res, next) => {
  listAuditLogsHandler(req, res).catch(next);
});
