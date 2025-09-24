import { Response } from 'express';
import createError from 'http-errors';

import { success } from '../../utils/http.js';
import { AuthRequest } from '../../middleware/auth.js';
import { createUser, deleteUser, listUsers, updateUser } from './users.service.js';
import { createUserSchema, queryUserSchema, updateUserSchema } from './users.schema.js';

export async function listUsersHandler(req: AuthRequest, res: Response) {
  const result = queryUserSchema.safeParse(req.query);
  if (!result.success) {
    throw createError(400, 'Invalid pagination params');
  }
  const response = await listUsers(result.data);
  return success(res, response, 'Users fetched');
}

export async function createUserHandler(req: AuthRequest, res: Response) {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const user = await createUser(result.data, req.user?.id ?? 'system');
  return success(res, user, 'User created', 201);
}

export async function updateUserHandler(req: AuthRequest, res: Response) {
  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const user = await updateUser(req.params.id, result.data, req.user?.id ?? 'system');
  return success(res, user, 'User updated');
}

export async function deleteUserHandler(req: AuthRequest, res: Response) {
  await deleteUser(req.params.id, req.user?.id ?? 'system');
  return success(res, { id: req.params.id }, 'User deleted');
}
