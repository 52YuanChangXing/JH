import { Response } from 'express';
import createError from 'http-errors';

import { AuthRequest } from '../../middleware/auth.js';
import { success } from '../../utils/http.js';
import { listAuditLogs } from './audit.service.js';
import { auditFilterSchema } from './audit.schema.js';

export async function listAuditLogsHandler(req: AuthRequest, res: Response) {
  const result = auditFilterSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, 'Invalid filter parameters');
  }
  const payload = await listAuditLogs(result.data);
  return success(res, payload, 'Audit logs fetched');
}
