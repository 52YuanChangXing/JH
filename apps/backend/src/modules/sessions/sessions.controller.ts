import { Response } from 'express';
import createError from 'http-errors';
import { AuthRequest } from '../../middleware/auth.js';
import { success } from '../../utils/http.js';
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  updateSession
} from './sessions.service.js';
import {
  createSessionSchema,
  sessionFilterSchema,
  updateSessionSchema
} from './sessions.schema.js';

export async function listSessionsHandler(req: AuthRequest, res: Response) {
  const result = sessionFilterSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, 'Invalid filter parameters');
  }
  const payload = await listSessions(result.data);
  return success(res, payload, 'Sessions fetched');
}

export async function getSessionHandler(req: AuthRequest, res: Response) {
  const session = await getSession(req.params.id);
  if (!session) {
    throw createError(404, 'Session not found');
  }
  return success(res, session, 'Session fetched');
}

export async function createSessionHandler(req: AuthRequest, res: Response) {
  const result = createSessionSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const session = await createSession(result.data, req.user?.id ?? 'system');
  return success(res, session, 'Session created', 201);
}

export async function updateSessionHandler(req: AuthRequest, res: Response) {
  const result = updateSessionSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const session = await updateSession(req.params.id, result.data, req.user?.id ?? 'system');
  return success(res, session, 'Session updated');
}

export async function deleteSessionHandler(req: AuthRequest, res: Response) {
  await deleteSession(req.params.id, req.user?.id ?? 'system');
  return success(res, { id: req.params.id }, 'Session deleted');
}
